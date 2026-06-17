import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';
import { AdminNotifyService } from './admin-notify.service';

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private adminNotify: AdminNotifyService,
  ) {}

  list(status?: string) {
    return this.prisma.supportTicket.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 5 },
        customer: { select: { id: true, name: true, phone: true } },
      },
      take: 100,
    });
  }

  async get(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        customer: true,
        order: { select: { id: true, status: true, total: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Chamado não encontrado');
    return ticket;
  }

  async createFromInbound(params: {
    phone: string;
    customerName?: string;
    customerId?: string;
    subject: string;
    body: string;
    category?: string;
    orderId?: string;
  }) {
    const open = await this.prisma.supportTicket.findFirst({
      where: { phone: params.phone, status: { in: ['open', 'in_progress'] } },
    });
    if (open) {
      await this.prisma.supportMessage.create({
        data: { ticketId: open.id, direction: 'inbound', body: params.body },
      });
      return open;
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        phone: params.phone,
        customerName: params.customerName,
        customerId: params.customerId,
        subject: params.subject,
        category: params.category ?? 'general',
        orderId: params.orderId,
        messages: {
          create: [{ direction: 'inbound', body: params.body }],
        },
      },
    });

    void this.adminNotify.notify('support_open', {
      nome: params.customerName ?? params.phone,
      telefone: params.phone,
      assunto: params.subject,
      ticket_id: ticket.id.slice(0, 8).toUpperCase(),
      link: `${this.whatsapp.siteUrl()}/admin/suporte`,
    });

    await this.whatsapp.sendTemplate(
      'bot_support_open',
      params.phone,
      {
        nome: params.customerName ?? 'Cliente',
        ticket: ticket.id.slice(0, 8).toUpperCase(),
        link: `${this.whatsapp.siteUrl()}/conta`,
      },
    );

    return ticket;
  }

  async reply(id: string, body: string) {
    const ticket = await this.get(id);
    await this.prisma.supportMessage.create({
      data: { ticketId: id, direction: 'outbound', body },
    });
    await this.prisma.supportTicket.update({
      where: { id },
      data: { status: 'in_progress', updatedAt: new Date() },
    });
    await this.whatsapp.sendText(ticket.phone, body, 'support_reply');
    return { ok: true };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        resolvedAt: ['resolved', 'closed'].includes(status) ? new Date() : null,
      },
    });
  }

  openCount() {
    return this.prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } });
  }
}
