import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private orders: OrdersService) {}

  async createPix(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido nao encontrado');

    const existing = await this.prisma.payment.findFirst({ where: { orderId } });
    if (existing) {
      return {
        payment_id: existing.id,
        status: existing.status,
        pix_copy_paste: existing.pixCopyPaste,
      };
    }

    const pix = `00020126POMARFRESH${orderId.slice(0, 8)}6304${uuidv4().slice(0, 4).toUpperCase()}`;
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        method: 'pix',
        status: 'pending',
        amount: order.total,
        pixCopyPaste: pix,
        idempotencyKey: `pix-${orderId}`,
      },
    });

    return {
      payment_id: payment.id,
      status: payment.status,
      pix_copy_paste: pix,
      pix_qr_code: pix,
    };
  }

  async simulatePayment(orderId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { orderId, status: 'pending' } });
    if (!payment) return { ok: true, reason: 'already_paid' };

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'confirmed', paidAt: new Date() },
    });

    await this.orders.updateStatus(orderId, 'confirmed');

    return { ok: true, status: 'confirmed' };
  }
}
