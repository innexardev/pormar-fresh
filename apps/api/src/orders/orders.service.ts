import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreService } from '../store/store.service';
import { BomService } from '../pricing/bom.service';
import { PricingAlertsService } from '../pricing/pricing-alerts.service';
import { DeliveryZonesService } from '../delivery/delivery-zones.service';
import { PromoService } from '../promo/promo.service';
import { computeCutoff, formatCutoffLabel } from '../production/production-calculator';
import { WhatsappService, OrderNotifyContext } from '../notifications/whatsapp.service';
import { PushService } from '../notifications/push.service';
import { AdminNotifyService } from '../notifications/admin-notify.service';
import { DeliveryRouteService } from '../delivery/delivery-route.service';

const STATUS_FLOW: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando pagamento',
  confirmed: 'Confirmado',
  preparing: 'Cortando',
  ready: 'Pronto',
  out_for_delivery: 'Em rota',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

function formatAddress(addr: Record<string, string>) {
  const parts = [
    [addr.street, addr.number].filter(Boolean).join(', '),
    addr.complement,
    addr.neighborhood,
    [addr.city, addr.state].filter(Boolean).join(' — '),
    addr.zip_code ? `CEP ${addr.zip_code}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private store: StoreService,
    private bom: BomService,
    private alerts: PricingAlertsService,
    private zones: DeliveryZonesService,
    private promo: PromoService,
    private whatsapp: WhatsappService,
    private push: PushService,
    private adminNotify: AdminNotifyService,
    private deliveryRoute: DeliveryRouteService,
  ) {}

  async createOrder(dto: {
    customer: { name: string; phone: string; email?: string };
    delivery_window_id: string;
    delivery_date: string;
    address: Record<string, string>;
    notes?: string;
    promo_code?: string;
    subscription_id?: string;
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

    const block = await this.prisma.deliveryBlock.findUnique({
      where: { blockDate: new Date(dto.delivery_date) },
    });
    if (block) throw new BadRequestException('Data de entrega indisponivel');

    const deliveryDate = new Date(`${dto.delivery_date}T12:00:00`);
    const cutoff = computeCutoff(deliveryDate, {
      cutoffWeekday: window.cutoffWeekday,
      cutoffHour: window.cutoffHour,
      orderDeadlineDaysBefore: window.orderDeadlineDaysBefore,
    });
    if (cutoff <= new Date()) {
      throw new BadRequestException(
        `Prazo encerrado para esta entrega. Pedidos aceitos até ${formatCutoffLabel(cutoff)}`,
      );
    }

    const quote = await this.zones.quoteAddress({
      zip_code: dto.address?.zip_code ?? '',
      neighborhood: dto.address?.neighborhood,
      city: dto.address?.city,
    });
    if (!quote.allowed) {
      throw new BadRequestException(quote.message ?? 'Endereco fora da area de entrega');
    }

    let customer = await this.prisma.customer.findUnique({ where: { phone: dto.customer.phone } });
    const isNewCustomer = !customer;
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          name: dto.customer.name,
          phone: dto.customer.phone,
          email: dto.customer.email,
        },
      });
    } else if (dto.customer.email || dto.customer.name !== customer.name) {
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: dto.customer.name,
          email: dto.customer.email ?? customer.email,
        },
      });
    }

    let subtotal = new Prisma.Decimal(0);
    const lineItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    const bomItems: Array<{
      comboId: string | null;
      productId: string | null;
      quantity: Prisma.Decimal;
      itemName: string;
    }> = [];

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
        bomItems.push({ comboId: combo.id, productId: null, quantity: qty, itemName: combo.name });
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
        bomItems.push({ comboId: null, productId: product.id, quantity: qty, itemName: product.name });
      }
    }

    if (subtotal.lt(settings.min_order_value)) {
      throw new BadRequestException(`Pedido minimo: R$ ${settings.min_order_value.toFixed(2)}`);
    }

    const bomCheck = await this.bom.validateStock(bomItems);
    if (!bomCheck.ok) {
      throw new BadRequestException(bomCheck.errors[0] ?? 'Estoque de producao insuficiente');
    }

    let discount = new Prisma.Decimal(0);
    let promoCode: string | undefined;
    if (dto.promo_code?.trim()) {
      const promoResult = await this.promo.validate(dto.promo_code, subtotal);
      discount = promoResult.discount;
      promoCode = promoResult.promoCode;
    }

    const deliveryFee = new Prisma.Decimal(quote.delivery_fee);
    const total = subtotal.add(deliveryFee).sub(discount);

    const order = await this.prisma.order.create({
      data: {
        customerId: customer.id,
        deliveryWindowId: dto.delivery_window_id,
        deliveryDate: new Date(dto.delivery_date),
        status: 'pending',
        subtotal,
        deliveryFee,
        discount,
        promoCode,
        subscriptionId: dto.subscription_id,
        total,
        addressJson: dto.address,
        notes: dto.notes,
        items: { create: lineItems },
        statusHistory: { create: { oldStatus: null, newStatus: 'pending' } },
      },
    });

    if (promoCode) await this.promo.applyUse(promoCode);

    void this.adminNotify.notify('new_order', {
      pedido: order.id.slice(0, 8).toUpperCase(),
      pedido_id: order.id,
      nome: customer.name,
      telefone: customer.phone,
      total: total.toFixed(2),
      entrega: window.label,
      data: dto.delivery_date,
    });

    if (isNewCustomer) {
      void this.adminNotify.notify('new_customer', {
        nome: customer.name,
        telefone: customer.phone,
      });
    }

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
    const paymentProvider = order.payments[0]?.idempotencyKey?.startsWith('asaas:') ? 'asaas' : 'mock';
    const allowSimulate =
      process.env.NODE_ENV !== 'production' || process.env.ALLOW_PIX_SIMULATE === 'true';
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
      pix_copy_paste: order.payments[0]?.pixCopyPaste ?? null,
      payment_provider: paymentProvider,
      can_simulate_pix: paymentProvider === 'mock' && allowSimulate,
    };
  }

  async listAdmin(status?: string, deliveryDate?: string) {
    const where: Prisma.OrderWhereInput = {};
    if (status === 'active') {
      where.status = { in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] };
    } else if (status && status !== 'all') {
      where.status = status;
    }
    if (deliveryDate) {
      where.deliveryDate = new Date(deliveryDate);
    }

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

  async getAdminOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        deliveryWindow: true,
        items: true,
        payments: true,
        statusHistory: { orderBy: { changedAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Pedido nao encontrado');
    return {
      order_id: order.id,
      customer_name: order.customer.name,
      customer_phone: order.customer.phone,
      status: order.status,
      payment_status: order.payments[0]?.status ?? 'pending',
      subtotal: Number(order.subtotal),
      delivery_fee: Number(order.deliveryFee),
      total: Number(order.total),
      delivery_date: order.deliveryDate.toISOString().slice(0, 10),
      delivery_label: order.deliveryWindow.label,
      address: order.addressJson,
      notes: order.notes,
      promo_code: order.promoCode,
      discount: Number(order.discount),
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
    };
  }

  async getSeparationList(deliveryDate?: string, statuses?: string[]) {
    const statusList = statuses?.length
      ? statuses
      : ['confirmed', 'preparing', 'ready'];

    const where: Prisma.OrderWhereInput = {
      status: { in: statusList },
    };
    if (deliveryDate) {
      where.deliveryDate = new Date(deliveryDate);
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: { customer: true, deliveryWindow: true, items: true },
      orderBy: [{ deliveryDate: 'asc' }, { createdAt: 'asc' }],
    });

    const aggregated = new Map<string, { name: string; quantity: number; unit: string }>();
    for (const order of orders) {
      for (const item of order.items) {
        const key = `${item.itemName}|${item.unitLabel}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.quantity += Number(item.quantity);
        } else {
          aggregated.set(key, {
            name: item.itemName,
            quantity: Number(item.quantity),
            unit: item.unitLabel,
          });
        }
      }
    }

    return {
      delivery_date: deliveryDate ?? null,
      orders_count: orders.length,
      aggregated: Array.from(aggregated.values()).sort((a, b) => a.name.localeCompare(b.name)),
      orders: orders.map((o) => {
        const address = o.addressJson as Record<string, string>;
        return {
          order_id: o.id,
          order_short: o.id.slice(0, 8).toUpperCase(),
          customer_name: o.customer.name,
          customer_phone: o.customer.phone,
          status: o.status,
          status_label: STATUS_LABEL[o.status] ?? o.status,
          delivery_label: o.deliveryWindow.label,
          delivery_date: o.deliveryDate.toISOString().slice(0, 10),
          total: Number(o.total),
          address,
          address_line: formatAddress(address),
          notes: o.notes,
          items: o.items.map((i) => ({
            name: i.itemName,
            quantity: Number(i.quantity),
            unit: i.unitLabel,
          })),
        };
      }),
    };
  }

  async getDeliveryRoute(deliveryDate: string, optimize = true) {
    return this.deliveryRoute.getRoute(deliveryDate, optimize);
  }

  async updateStatusBulk(orderIds: string[], newStatus: string) {
    const results: Array<{ order_id: string; ok: boolean; error?: string }> = [];
    for (const orderId of orderIds) {
      try {
        await this.updateStatus(orderId, newStatus);
        results.push({ order_id: orderId, ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar';
        results.push({ order_id: orderId, ok: false, error: message });
      }
    }
    return {
      success: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  }

  async updateStatus(orderId: string, newStatus: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: true, deliveryWindow: true },
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
      const paid = await this.prisma.payment.findFirst({
        where: { orderId, status: 'confirmed' },
      });
      if (!paid) {
        void this.whatsapp.orderConfirmed(this.orderCtx(order));
      }
    }

    if (newStatus === 'preparing') {
      void this.whatsapp.orderPreparing(this.orderCtx(order));
    }

    if (newStatus === 'ready') {
      void this.whatsapp.orderReady(this.orderCtx(order));
      void this.push.notifyAll('Pedido pronto!', `${order.customer.name}, seu pedido Pomar Fresh está pronto para entrega.`, `/pedido/${orderId}`);
    }

    if (newStatus === 'out_for_delivery') {
      void this.whatsapp.orderOutForDelivery(this.orderCtx(order));
    }

    if (newStatus === 'delivered') {
      void this.whatsapp.orderDelivered(this.orderCtx(order));
      void this.push.notifyAll('Pedido entregue!', 'Obrigado por comprar no Pomar Fresh.', '/');
    }

    const wasStockDeducted = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(
      order.status,
    );
    if (newStatus === 'cancelled' && wasStockDeducted) {
      await this.restoreStock(order.items);
      await this.bom.restoreForOrder(orderId, order.items);
    }

    if (newStatus === 'cancelled') {
      void this.whatsapp.orderCancelled(this.orderCtx(order));
      void this.adminNotify.notify('order_cancelled', {
        pedido: order.id.slice(0, 8).toUpperCase(),
        pedido_id: order.id,
        nome: order.customer.name,
        telefone: order.customer.phone,
        total: Number(order.total).toFixed(2),
      });
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

  private async restoreStock(items: { productId: string | null; quantity: Prisma.Decimal; itemName: string }[]) {
    for (const item of items) {
      if (!item.productId) continue;
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;
      const newStock = product.stockQty.add(item.quantity);
      await this.prisma.$transaction([
        this.prisma.product.update({
          where: { id: product.id },
          data: { stockQty: newStock },
        }),
        this.prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: 'in',
            quantity: item.quantity,
            reason: 'Cancelamento pedido',
          },
        }),
      ]);
    }
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

  async exportCsv(status?: string, from?: string, to?: string) {
    const where: Prisma.OrderWhereInput = {};
    if (status && status !== 'all') {
      if (status === 'active') {
        where.status = { in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] };
      } else where.status = status;
    }
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(from);
      if (to) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(`${to}T23:59:59`);
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: { customer: true, deliveryWindow: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const header =
      'order_id,created_at,status,customer_name,customer_phone,delivery_date,delivery_label,subtotal,delivery_fee,discount,total,promo_code,items';
    const rows = orders.map((o) => {
      const items = o.items.map((i) => `${Number(i.quantity)}x ${i.itemName}`).join(' | ');
      return [
        o.id,
        o.createdAt.toISOString(),
        o.status,
        `"${o.customer.name.replace(/"/g, '""')}"`,
        o.customer.phone,
        o.deliveryDate.toISOString().slice(0, 10),
        `"${o.deliveryWindow.label.replace(/"/g, '""')}"`,
        Number(o.subtotal),
        Number(o.deliveryFee),
        Number(o.discount),
        Number(o.total),
        o.promoCode ?? '',
        `"${items.replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  async resendTrackingLink(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, deliveryWindow: true },
    });
    if (!order) throw new NotFoundException('Pedido nao encontrado');
    await this.whatsapp.resendTrackingLink(this.orderCtx(order));
    return { ok: true };
  }

  private orderCtx(order: {
    id: string;
    total: Prisma.Decimal;
    deliveryDate: Date;
    customer: { name: string; phone: string };
    deliveryWindow: { label: string };
  }): OrderNotifyContext {
    return {
      orderId: order.id,
      name: order.customer.name,
      phone: order.customer.phone,
      total: Number(order.total),
      deliveryLabel: order.deliveryWindow.label,
      deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
    };
  }
}
