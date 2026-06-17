import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';
import { AdminNotifyService } from './admin-notify.service';

@Injectable()
export class EngagementService implements OnModuleInit {
  private readonly logger = new Logger(EngagementService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private adminNotify: AdminNotifyService,
  ) {}

  onModuleInit() {
    const dayMs = 24 * 60 * 60 * 1000;
    setInterval(() => {
      void this.runInactivityReminders().then((r) => {
        if (r.sent > 0) this.logger.log(`Lembretes automáticos: ${r.sent} enviados`);
      });
    }, dayMs);
  }

  async runInactivityReminders(): Promise<{ sent: number; skipped: number }> {
    const settings = await this.adminNotify.getSettings();
    if (!settings.inactivity_reminder_enabled) return { sent: 0, skipped: 0 };

    const days = settings.inactivity_reminder_days || 14;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const reminderCooldown = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const customers = await this.prisma.customer.findMany({
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    let sent = 0;
    let skipped = 0;

    for (const c of customers) {
      const lastOrder = c.orders[0];
      const lastActivity = lastOrder?.createdAt ?? c.createdAt;

      if (lastActivity > cutoff) {
        skipped++;
        continue;
      }
      if (c.lastEngagementReminderAt && c.lastEngagementReminderAt > reminderCooldown) {
        skipped++;
        continue;
      }

      try {
        await this.whatsapp.sendTemplate(
          c.phone,
          'reminder_inactive',
          {
            nome: c.name,
            dias: String(days),
            link: `${this.whatsapp.siteUrl()}/cardapio`,
          },
          lastOrder?.id,
        );
        await this.prisma.customer.update({
          where: { id: c.id },
          data: { lastEngagementReminderAt: new Date() },
        });
        sent++;
      } catch {
        this.logger.warn(`Lembrete falhou: ${c.phone}`);
      }
    }

    return { sent, skipped };
  }
}
