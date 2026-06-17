import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MessageTemplateService } from './message-template.service';

export type OrderNotifyContext = {
  orderId: string;
  name: string;
  phone: string;
  total?: number;
  deliveryLabel?: string;
  deliveryDate?: string;
  pix?: string;
};

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private templates: MessageTemplateService,
  ) {}

  isEnabled(): boolean {
    return Boolean(this.config.get('WHATSAPP_API_URL'));
  }

  siteUrl(): string {
    return (this.config.get('NEXT_PUBLIC_SITE_URL') || 'https://onnshoppe.com').replace(/\/$/, '');
  }

  orderLink(orderId: string): string {
    return `${this.siteUrl()}/pedido/${orderId}`;
  }

  private baseVars(ctx: OrderNotifyContext): Record<string, string> {
    return {
      nome: ctx.name,
      pedido: ctx.orderId.slice(0, 8).toUpperCase(),
      total: ctx.total != null ? ctx.total.toFixed(2) : '',
      entrega: ctx.deliveryLabel ?? '',
      data: ctx.deliveryDate ?? '',
      link: this.orderLink(ctx.orderId),
      pix: ctx.pix ?? '',
    };
  }

  async sendTemplate(
    templateKey: string,
    phone: string,
    vars: Record<string, string>,
    orderId?: string,
  ): Promise<void> {
    const body = (await this.templates.render(templateKey, vars)) ?? this.templates.fallback(templateKey, vars);
    if (!body) return;
    await this.sendText(phone, body, templateKey, orderId);
  }

  async sendText(phone: string, text: string, templateKey?: string, orderId?: string): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug(`WhatsApp (mock): ${phone} — ${text.slice(0, 80)}...`);
      await this.logMessage(phone, text, 'mock', templateKey, orderId);
      return;
    }

    const baseUrl = this.config.get<string>('WHATSAPP_API_URL')!.replace(/\/$/, '');
    const apiKey = this.config.get<string>('WHATSAPP_API_KEY', '');
    const instance = this.config.get<string>('WHATSAPP_INSTANCE', 'pomar-fresh');
    const number = phone.replace(/\D/g, '');
    const fullNumber = number.startsWith('55') ? number : `55${number}`;

    try {
      const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: apiKey },
        body: JSON.stringify({ number: fullNumber, text }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        this.logger.error(`WhatsApp falhou: ${res.status} ${errBody}`);
        await this.logMessage(phone, text, 'failed', templateKey, orderId, errBody);
        return;
      }
      await this.logMessage(phone, text, 'sent', templateKey, orderId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`WhatsApp erro: ${msg}`);
      await this.logMessage(phone, text, 'failed', templateKey, orderId, msg);
    }
  }

  private async logMessage(
    phone: string,
    body: string,
    status: string,
    templateKey?: string,
    orderId?: string,
    error?: string,
  ) {
    try {
      await this.prisma.whatsappMessageLog.create({
        data: { phone, body, status, templateKey, orderId, error },
      });
    } catch {
      /* ignore log failures */
    }
  }

  notifyOrderEvent(templateKey: string, ctx: OrderNotifyContext) {
    return this.sendTemplate(templateKey, ctx.phone, this.baseVars(ctx), ctx.orderId);
  }

  orderCreated(ctx: OrderNotifyContext) {
    return this.notifyOrderEvent('order_created', ctx);
  }

  paymentPending(ctx: OrderNotifyContext) {
    return this.notifyOrderEvent('payment_pending', ctx);
  }

  paymentConfirmed(ctx: OrderNotifyContext) {
    return this.notifyOrderEvent('payment_confirmed', ctx);
  }

  orderConfirmed(ctx: OrderNotifyContext) {
    return this.notifyOrderEvent('order_confirmed', ctx);
  }

  orderPreparing(ctx: OrderNotifyContext) {
    return this.notifyOrderEvent('order_preparing', ctx);
  }

  orderReady(ctx: OrderNotifyContext) {
    return this.notifyOrderEvent('order_ready', ctx);
  }

  orderOutForDelivery(ctx: OrderNotifyContext) {
    return this.notifyOrderEvent('order_out_for_delivery', ctx);
  }

  orderDelivered(ctx: OrderNotifyContext) {
    return this.notifyOrderEvent('order_delivered', ctx);
  }

  subscriptionCreated(name: string, phone: string, deliveryLabel: string) {
    return this.sendTemplate('subscription_created', phone, {
      nome: name,
      entrega: deliveryLabel,
      link: `${this.siteUrl()}/cardapio`,
    });
  }

  sendOtp(phone: string, code: string) {
    return this.sendTemplate('otp_login', phone, { codigo: code });
  }

  resendTrackingLink(ctx: OrderNotifyContext) {
    return this.notifyOrderEvent('tracking_link', ctx);
  }

  orderCancelled(ctx: OrderNotifyContext) {
    return this.notifyOrderEvent('order_cancelled', ctx);
  }

  async getConnectionState(): Promise<{ connected: boolean; state?: string }> {
    if (!this.isEnabled()) return { connected: false, state: 'disabled' };

    const { baseUrl, apiKey, instance } = this.evolutionConfig();

    try {
      const res = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
        headers: { apikey: apiKey },
      });
      if (!res.ok) return { connected: false, state: `http_${res.status}` };
      const data = (await res.json()) as { instance?: { state?: string }; state?: string };
      const state = data.instance?.state ?? data.state ?? 'unknown';
      return { connected: state === 'open', state };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unreachable';
      return { connected: false, state: msg };
    }
  }

  private evolutionConfig() {
    return {
      baseUrl: this.config.get<string>('WHATSAPP_API_URL')!.replace(/\/$/, ''),
      apiKey: this.config.get<string>('WHATSAPP_API_KEY', ''),
      instance: this.config.get<string>('WHATSAPP_INSTANCE', 'pomar-fresh'),
    };
  }

  private extractQr(data: Record<string, unknown>): string | null {
    const qrcode = data.qrcode as Record<string, unknown> | undefined;
    const candidates = [
      data.base64,
      qrcode?.base64,
      data.code,
      qrcode?.code,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.length > 50) {
        return c.startsWith('data:') ? c : `data:image/png;base64,${c}`;
      }
    }
    return null;
  }

  private async evolutionFetch(path: string, init?: RequestInit) {
    const { baseUrl, apiKey } = this.evolutionConfig();
    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  }

  async restartInstance(): Promise<{ ok: boolean; message: string }> {
    if (!this.isEnabled()) return { ok: false, message: 'WhatsApp desabilitado' };

    const { instance } = this.evolutionConfig();

    await this.evolutionFetch(`/instance/logout/${instance}`, { method: 'DELETE' }).catch(() => null);
    await this.evolutionFetch(`/instance/delete/${instance}`, { method: 'DELETE' }).catch(() => null);
    await new Promise((r) => setTimeout(r, 1500));

    const create = await this.evolutionFetch('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: instance,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      }),
    });

    if (!create.ok) {
      const body = await create.text();
      return { ok: false, message: `Falha ao recriar instância: ${body.slice(0, 200)}` };
    }

    return { ok: true, message: 'Instância recriada. Gere o QR code novamente.' };
  }

  async fetchQrCode(): Promise<{
    qrcode: string | null;
    pairingCode?: string | null;
    state?: string;
    error?: string;
    managerHint?: string;
  }> {
    if (!this.isEnabled()) {
      return { qrcode: null, error: 'WHATSAPP_API_URL não configurado na API' };
    }

    const { instance } = this.evolutionConfig();
    const domain = this.config.get('DOMAIN') || 'onnshoppe.com';

    try {
      await this.ensureInstance();

      for (let attempt = 0; attempt < 5; attempt++) {
        const res = await this.evolutionFetch(`/instance/connect/${instance}`);
        const data = (await res.json()) as Record<string, unknown>;

        const qr = this.extractQr(data);
        const pairingCode =
          typeof data.pairingCode === 'string'
            ? data.pairingCode
            : typeof (data.qrcode as Record<string, unknown>)?.pairingCode === 'string'
              ? ((data.qrcode as Record<string, unknown>).pairingCode as string)
              : null;

        if (qr || pairingCode) {
          const stateRes = await this.evolutionFetch(`/instance/connectionState/${instance}`);
          const stateData = (await stateRes.json()) as { instance?: { state?: string } };
          return {
            qrcode: qr,
            pairingCode,
            state: stateData.instance?.state,
          };
        }

        await new Promise((r) => setTimeout(r, 2000));
      }

      const stateRes = await this.evolutionFetch(`/instance/connectionState/${instance}`);
      const stateData = (await stateRes.json()) as { instance?: { state?: string } };

      return {
        qrcode: null,
        state: stateData.instance?.state,
        error: 'QR code ainda não disponível. Use o Manager da Evolution ou clique em Reiniciar instância.',
        managerHint: `https://evolution.${domain}/manager`,
      };
    } catch (err) {
      return {
        qrcode: null,
        error: err instanceof Error ? err.message : 'Erro ao buscar QR code',
        managerHint: `https://evolution.${domain}/manager`,
      };
    }
  }

  async ensureInstance(): Promise<void> {
    if (!this.isEnabled()) return;

    const { instance } = this.evolutionConfig();

    const check = await this.evolutionFetch(`/instance/connectionState/${instance}`);
    if (check.ok) return;

    const list = await this.evolutionFetch('/instance/fetchInstances');
    if (list.ok) {
      const instances = (await list.json()) as Array<{ name?: string }>;
      if (instances.some((i) => i.name === instance)) return;
    }

    await this.evolutionFetch('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: instance,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      }),
    });
  }
}
