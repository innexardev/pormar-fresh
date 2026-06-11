import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { StoreService } from '../store/store.service';
import { BomService } from '../pricing/bom.service';
import { PricingAlertsService } from '../pricing/pricing-alerts.service';

const STATUS_FLOW: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private store: StoreService,
    private bom: BomService,
    private alerts: PricingAlertsService,
  ) {}

  async createOrder(dto: {
    customer: { name: string; phone: string; email?: string };
    delivery_window_id: string;
    delivery_date: string;
    address: Record<string, string>;
    notes?: string;
    items: Array<{
      type: 'product' | 'combo';
      id: string;
      quantity: number;
    }>;
  }) {
    const settings = await this.store.getPublicInfo();
    const window = await this.prisma.deliveryWindow.findUnique({
      where: { id: dto.delivery_window_id },
    });
    if (!window?.active) throw new BadRequestException('Janela de entrega invalida');

    let customer = await this.prisma.customer.findUnique({ where: { phone: dto.customer.phone } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          name: dto.customer.name,
          phone: dto.customer.phone,
          email: dto.customer.email,
        },
      });
    }

    let subtotal = new Prisma.Decimal(0);
    const lineItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const item of dto.items) {
      if (item.type === 'combo') {
        const combo = await this.prisma.combo.findFirst({ where: { id: item.id, active: true } });
        if (!combo) throw new NotFoundException(`Combo nao encontrado: ${item.id}`);
        const qty = new Prisma.Decimal(item.quantity);
        const lineTotal = combo.price.mul(qty);
        subtotal = subtotal.add(lineTotal);
        lineItems.push({
          combo: { connect: { id: combo.id } },
          itemName: combo.name,
          quantity: qty,
          unitLabel: 'un',
          unitPrice: combo.price,
          lineTotal,
        });
      } else {
        const product = await this.prisma.product.findFirst({
          where: { id: item.id, active: true },
        });
        if (!product) throw new NotFoundException(`Produto nao encontrado: ${item.id}`);
        if (product.stockQty.lt(item.quantity)) {
          throw new BadRequestException(`Estoque insuficiente: ${product.name}`);
        }
        const qty = new Prisma.Decimal(item.quantity);
        const lineTotal = product.price.mul(qty);
        subtotal = subtotal.add(lineTotal);
        lineItems.push({
          product: { connect: { id: product.id } },
          itemName: product.name,
          quantity: qty,
          unitLabel: product.unitType,
          unitPrice: product.price,
          lineTotal,
        });
      }
    }

    if (subtotal.lt(settings.min_order_value)) {
      throw new BadRequestException(`Pedido minimo: R$ ${settings.min_order_value.toFixed(2)}`);
    }

    const deliveryFee = new Prisma.Decimal(settings.delivery_fee);
    const total = subtotal.add(deliveryFee);

    const order = await this.prisma.order.create({
      data: {
        customerId: customer.id,
        deliveryWindowId: dto.delivery_window_id,
        deliveryDate: new Date(dto.delivery_date),
        status: 'pending',
        subtotal,
        deliveryFee,
        total,
        addressJson: dto.address,
        notes: dto.notes,
        items: { create: lineItems },
        statusHistory: { create: { oldStatus: null, newStatus: 'pending' } },
      },
    });

    return {
      order_id: order.id,
      status: order.status,
      subtotal: Number(subtotal),
      delivery_fee: Number(deliveryFee),
      total: Number(total),
      delivery_date: dto.delivery_date,
      delivery_label: window.label,
    };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        deliveryWindow: true,
        statusHistory: { orderBy: { changedAt: 'asc' } },
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Pedido nao encontrado');
    return {
      order_id: order.id,
      status: order.status,
      total: Number(order.total),
      delivery_date: order.deliveryDate.toISOString().slice(0, 10),
      delivery_label: order.deliveryWindow.label,
      items: order.items.map((i) => ({
        name: i.itemName,
        quantity: Number(i.quantity),
        unit: i.unitLabel,
        line_total: Number(i.lineTotal),
      })),
      timeline: order.statusHistory.map((h) => ({
        status: h.newStatus,
        at: h.changedAt.toISOString(),
      })),
      payment_status: order.payments[0]?.status ?? 'pending',
    };
  }

  async listAdmin(status?: string) {
    const where: Prisma.OrderWhereInput = {};
    if (status === 'active') {
      where.status = { in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] };
    } else if (status) where.status = status;

    const orders = await this.prisma.order.findMany({
      where,
      include: { customer: true, deliveryWindow: true },
      orderBy: [{ deliveryDate: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });

    return orders.map((o) => ({
      order_id: o.id,
      customer_name: o.customer.name,
      customer_phone: o.customer.phone,
      status: o.status,
      total: Number(o.total),
      delivery_date: o.deliveryDate.toISOString().slice(0, 10),
      delivery_label: o.deliveryWindow.label,
      created_at: o.createdAt.toISOString(),
    }));
  }

  async updateStatus(orderId: string, newStatus: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pedido nao encontrado');

    const allowed = STATUS_FLOW[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException('Transicao de status invalida');
    }

    if (newStatus === 'confirmed' && order.status === 'pending') {
      await this.deductStock(order.items);
      await this.bom.deductForOrder(orderId, order.items);
      void this.alerts.scanAll();
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    await this.prisma.orderStatusHistory.create({
      data: { orderId, oldStatus: order.status, newStatus },
    });

    return { order_id: updated.id, status: updated.status };
  }

  private async deductStock(items: { productId: string | null; quantity: Prisma.Decimal; itemName: string }[]) {
    for (const item of items) {
      if (!item.productId) continue;
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;
      const newStock = product.stockQty.sub(item.quantity);
      await this.prisma.$transaction([
        this.prisma.product.update({
          where: { id: product.id },
          data: { stockQty: newStock.lt(0) ? 0 : newStock },
        }),
        this.prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: 'out',
            quantity: item.quantity,
            reason: 'Pedido confirmado',
          },
        }),
      ]);
    }
  }
}
