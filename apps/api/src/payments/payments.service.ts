import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { AsaasService } from './asaas.service';
import { WhatsappService, OrderNotifyContext } from '../notifications/whatsapp.service';
import { AdminNotifyService } from '../notifications/admin-notify.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private orders: OrdersService,
    private asaas: AsaasService,
    private whatsapp: WhatsappService,
    private adminNotify: AdminNotifyService,
  ) {}

  async createPix(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Pedido nao encontrado');

    const existing = await this.prisma.payment.findFirst({ where: { orderId } });
    if (existing) {
      return {
        payment_id: existing.id,
        status: existing.status,
        pix_copy_paste: existing.pixCopyPaste,
        provider: existing.idempotencyKey?.startsWith('asaas:') ? 'asaas' : 'mock',
      };
    }

    let result;
    if (this.asaas.isEnabled()) {
      result = await this.createAsaasPix(order);
    } else {
      result = await this.createMockPix(orderId, order.total);
    }

    void this.notifyPixCreated(orderId, result.pix_copy_paste ?? '');
    return result;
  }

  private async notifyPixCreated(orderId: string, pix: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, deliveryWindow: true },
    });
    if (!order) return;
    const ctx: OrderNotifyContext = {
      orderId: order.id,
      name: order.customer.name,
      phone: order.customer.phone,
      total: Number(order.total),
      deliveryLabel: order.deliveryWindow.label,
      deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
      pix,
    };
    void this.whatsapp.orderCreated(ctx);
    void this.whatsapp.paymentPending(ctx);
  }

  private async createMockPix(orderId: string, amount: Prisma.Decimal) {
    const pix = `00020126POMARFRESH${orderId.slice(0, 8)}6304${uuidv4().slice(0, 4).toUpperCase()}`;
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        method: 'pix',
        status: 'pending',
        amount,
        pixCopyPaste: pix,
        idempotencyKey: `pix-${orderId}`,
      },
    });

    return {
      payment_id: payment.id,
      status: payment.status,
      pix_copy_paste: pix,
      pix_qr_code: pix,
      provider: 'mock',
    };
  }

  private async createAsaasPix(order: {
    id: string;
    total: Prisma.Decimal;
    customer: { id: string; name: string; phone: string; email: string | null };
  }) {
    const customerId = await this.asaas.findOrCreateCustomer({
      name: order.customer.name,
      phone: order.customer.phone,
      email: order.customer.email ?? undefined,
      externalReference: `customer:${order.customer.id}`,
    });

    const asaasPayment = await this.asaas.createPixPayment({
      customerId,
      value: order.total.toNumber(),
      externalReference: `order:${order.id}`,
      description: `Pedido Pomar Fresh #${order.id.slice(0, 8)}`,
    });

    const pixCopy = asaasPayment.pixTransaction?.payload ?? '';
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'pix',
        status: 'pending',
        amount: order.total,
        pixCopyPaste: pixCopy,
        idempotencyKey: `asaas:${asaasPayment.id}`,
      },
    });

    return {
      payment_id: payment.id,
      status: payment.status,
      pix_copy_paste: pixCopy,
      pix_qr_code: asaasPayment.pixTransaction?.encodedImage ?? pixCopy,
      invoice_url: asaasPayment.invoiceUrl,
      provider: 'asaas',
    };
  }

  async simulatePayment(orderId: string) {
    if (this.asaas.isEnabled()) {
      return { ok: false, reason: 'asaas_enabled_use_webhook' };
    }
    return this.confirmPayment(orderId);
  }

  async confirmPayment(orderId: string, asaasPaymentId?: string) {
    const payment = await this.prisma.payment.findFirst({ where: { orderId, status: 'pending' } });
    if (!payment) return { ok: true, reason: 'already_paid' };

    if (asaasPaymentId && this.asaas.isEnabled()) {
      const remote = await this.asaas.getPayment(asaasPaymentId);
      if (!['RECEIVED', 'CONFIRMED'].includes(remote.status)) {
        return { ok: false, reason: 'payment_not_confirmed' };
      }
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'confirmed', paidAt: new Date() },
    });

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, deliveryWindow: true },
    });
    if (order) {
      void this.whatsapp.paymentConfirmed({
        orderId: order.id,
        name: order.customer.name,
        phone: order.customer.phone,
        total: Number(order.total),
        deliveryLabel: order.deliveryWindow.label,
        deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
      });
      void this.adminNotify.notify('payment_received', {
        pedido: order.id.slice(0, 8).toUpperCase(),
        pedido_id: order.id,
        nome: order.customer.name,
        telefone: order.customer.phone,
        total: Number(order.total).toFixed(2),
      });
    }

    await this.orders.updateStatus(orderId, 'confirmed');

    return { ok: true, status: 'confirmed' };
  }
}
