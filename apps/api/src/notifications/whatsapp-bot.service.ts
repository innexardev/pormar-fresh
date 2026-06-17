import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';
import { BotMenuService } from './bot-menu.service';
import { SupportService } from './support.service';

@Injectable()
export class WhatsappBotService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private botMenu: BotMenuService,
    private support: SupportService,
  ) {}

  async handleInbound(phone: string, rawText: string) {
    const text = rawText.trim().toLowerCase();

    await this.prisma.whatsappMessageLog.create({
      data: {
        phone,
        body: rawText,
        status: 'inbound',
        templateKey: 'inbound',
      },
    });

    const customer = await this.findCustomer(phone);
    const option = await this.botMenu.findByTrigger(text);

    if (option?.action) {
      await this.runAction(option.action, phone, customer, rawText);
      return;
    }

    if (['menu', '0', 'ajuda', 'help'].includes(text)) {
      await this.sendMenu(phone);
      return;
    }

    if (text.length > 3 && !/^\d+$/.test(text)) {
      await this.support.createFromInbound({
        phone,
        customerName: customer?.name,
        customerId: customer?.id,
        subject: 'Mensagem via WhatsApp',
        body: rawText,
        category: 'general',
      });
      return;
    }

    await this.sendMenu(phone);
  }

  private async runAction(
    action: string,
    phone: string,
    customer: { id: string; name: string; phone: string } | null,
    rawText: string,
  ) {
    switch (action) {
      case 'show_menu':
        await this.sendMenu(phone);
        break;
      case 'open_cardapio':
        await this.whatsapp.sendTemplate('bot_cardapio', phone, {
          link: `${this.whatsapp.siteUrl()}/cardapio`,
        });
        break;
      case 'open_conta':
        await this.whatsapp.sendTemplate('bot_conta', phone, {
          link: `${this.whatsapp.siteUrl()}/conta`,
        });
        break;
      case 'open_promo':
        await this.whatsapp.sendTemplate('bot_promo', phone, {
          link: `${this.whatsapp.siteUrl()}/cardapio`,
          cupom: 'POMAR10',
        });
        break;
      case 'show_status':
        await this.handleStatus(phone, customer);
        break;
      case 'open_support':
        await this.support.createFromInbound({
          phone,
          customerName: customer?.name,
          customerId: customer?.id,
          subject: 'Cliente solicitou suporte',
          body: rawText || 'Solicitação via menu',
          category: 'support',
        });
        break;
      default:
        await this.sendMenu(phone);
    }
  }

  private async sendMenu(phone: string) {
    const menu = await this.botMenu.buildMenuText();
    await this.whatsapp.sendText(phone, menu, 'bot_menu');
  }

  private async handleStatus(
    phone: string,
    customer: { id: string; name: string; phone: string } | null,
  ) {
    if (!customer) {
      await this.whatsapp.sendTemplate('bot_no_customer', phone, {
        link: `${this.whatsapp.siteUrl()}/conta`,
      });
      return;
    }

    const order = await this.prisma.order.findFirst({
      where: {
        customerId: customer.id,
        status: { notIn: ['delivered', 'cancelled'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { deliveryWindow: true },
    });

    if (!order) {
      await this.whatsapp.sendTemplate('bot_no_order', phone, {
        link: `${this.whatsapp.siteUrl()}/cardapio`,
      });
      return;
    }

    await this.whatsapp.resendTrackingLink({
      orderId: order.id,
      name: customer.name,
      phone: customer.phone,
      deliveryLabel: order.deliveryWindow.label,
      deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
      total: Number(order.total),
    });
  }

  private findCustomer(phone: string) {
    const normalized = phone.replace(/\D/g, '').slice(-11);
    return this.prisma.customer.findFirst({
      where: {
        OR: [{ phone: { contains: normalized } }, { phone: { endsWith: normalized.slice(-9) } }],
      },
    });
  }
}
