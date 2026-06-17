import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  isEnabled(): boolean {
    return Boolean(this.config.get('VAPID_PUBLIC_KEY') && this.config.get('VAPID_PRIVATE_KEY'));
  }

  getPublicKey(): string | null {
    return this.config.get('VAPID_PUBLIC_KEY') ?? null;
  }

  async subscribe(data: { endpoint: string; keys: { p256dh: string; auth: string }; phone?: string }) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        endpoint: data.endpoint,
        keysJson: data.keys,
        phone: data.phone,
      },
      update: { keysJson: data.keys, phone: data.phone },
    });
  }

  async notifyAll(title: string, body: string, url?: string) {
    if (!this.isEnabled()) {
      this.logger.debug(`Push (mock): ${title} — ${body}`);
      return { sent: 0, mock: true };
    }

    let webpush: typeof import('web-push');
    try {
      webpush = await import('web-push');
    } catch {
      this.logger.warn('web-push nao instalado');
      return { sent: 0, error: 'web-push missing' };
    }

    webpush.setVapidDetails(
      this.config.get('VAPID_SUBJECT', 'mailto:admin@pomarfresh.com'),
      this.config.get('VAPID_PUBLIC_KEY')!,
      this.config.get('VAPID_PRIVATE_KEY')!,
    );

    const subs = await this.prisma.pushSubscription.findMany();
    let sent = 0;
    const payload = JSON.stringify({ title, body, url });

    for (const sub of subs) {
      try {
        const keys = sub.keysJson as { p256dh: string; auth: string };
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
          payload,
        );
        sent++;
      } catch (e) {
        this.logger.warn(`Push falhou: ${sub.endpoint.slice(0, 40)}...`);
      }
    }

    return { sent };
  }
}
