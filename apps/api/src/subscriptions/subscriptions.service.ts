import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryService } from '../delivery/delivery.service';
import { OrdersService } from '../orders/orders.service';
import { WhatsappService } from '../notifications/whatsapp.service';
import { AdminNotifyService } from '../notifications/admin-notify.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private delivery: DeliveryService,
    private orders: OrdersService,
    private whatsapp: WhatsappService,
    private adminNotify: AdminNotifyService,
  ) {}

  async create(dto: {
    customer: { name: string; phone: string; email?: string };
    delivery_window_id: string;
    address: Record<string, string>;
    notes?: string;
    items: Array<{ type: 'product' | 'combo'; id: string; quantity: number }>;
  }) {
    if (!dto.items.length) throw new BadRequestException('Assinatura precisa de ao menos um item');

    let customer = await this.prisma.customer.findUnique({ where: { phone: dto.customer.phone } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { name: dto.customer.name, phone: dto.customer.phone, email: dto.customer.email },
      });
    } else if (dto.customer.name !== customer.name) {
      await this.prisma.customer.update({ where: { id: customer.id }, data: { name: dto.customer.name } });
    }

    const lineItems: Prisma.SubscriptionItemCreateWithoutSubscriptionInput[] = [];
    for (const item of dto.items) {
      if (item.type === 'combo') {
        const combo = await this.prisma.combo.findFirst({ where: { id: item.id, active: true } });
        if (!combo) throw new NotFoundException(`Combo nao encontrado: ${item.id}`);
        lineItems.push({
          combo: { connect: { id: combo.id } },
          itemName: combo.name,
          quantity: item.quantity,
          unitLabel: 'un',
        });
      } else {
        const product = await this.prisma.product.findFirst({ where: { id: item.id, active: true } });
        if (!product) throw new NotFoundException(`Produto nao encontrado: ${item.id}`);
        lineItems.push({
          product: { connect: { id: product.id } },
          itemName: product.name,
          quantity: item.quantity,
          unitLabel: product.unitType,
        });
      }
    }

    const sub = await this.prisma.subscription.create({
      data: {
        customerId: customer.id,
        deliveryWindowId: dto.delivery_window_id,
        status: 'active',
        addressJson: dto.address,
        notes: dto.notes,
        items: { create: lineItems },
      },
      include: { items: true, deliveryWindow: true, customer: true },
    });

    void this.whatsapp.subscriptionCreated(customer.name, customer.phone, sub.deliveryWindow.label);
    void this.adminNotify.notify('new_subscription', {
      nome: customer.name,
      telefone: customer.phone,
      entrega: sub.deliveryWindow.label,
    });

    return {
      subscription_id: sub.id,
      status: sub.status,
      delivery_label: sub.deliveryWindow.label,
    };
  }

  listAdmin(status?: string) {
    return this.prisma.subscription.findMany({
      where: status ? { status } : undefined,
      include: {
        customer: true,
        deliveryWindow: true,
        items: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: 'active' | 'paused' | 'cancelled') {
    return this.prisma.subscription.update({ where: { id }, data: { status } });
  }

  async generateWeeklyOrders() {
    const windows = await this.delivery.getAvailableWindows();
    const active = await this.prisma.subscription.findMany({
      where: { status: 'active' },
      include: { customer: true, items: true },
    });

    const created: string[] = [];
    const skipped: string[] = [];

    for (const sub of active) {
      const window = windows.find((w) => w.id === sub.deliveryWindowId);
      if (!window) {
        skipped.push(sub.id);
        continue;
      }

      const exists = await this.prisma.order.findFirst({
        where: {
          subscriptionId: sub.id,
          deliveryDate: new Date(window.delivery_date),
        },
      });
      if (exists) {
        skipped.push(sub.id);
        continue;
      }

      const address = sub.addressJson as Record<string, string>;
      const order = await this.orders.createOrder({
        customer: { name: sub.customer.name, phone: sub.customer.phone, email: sub.customer.email ?? undefined },
        delivery_window_id: sub.deliveryWindowId,
        delivery_date: window.delivery_date,
        address,
        notes: sub.notes ? `[Assinatura] ${sub.notes}` : '[Assinatura semanal]',
        subscription_id: sub.id,
        items: sub.items.map((i) => ({
          type: i.comboId ? ('combo' as const) : ('product' as const),
          id: (i.comboId ?? i.productId)!,
          quantity: Number(i.quantity),
        })),
      });

      created.push(order.order_id);
    }

    return { created_count: created.length, skipped_count: skipped.length, order_ids: created };
  }
}
