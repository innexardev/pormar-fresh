import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';
import {
  ADMIN_NOTIFY_TEMPLATE_KEYS,
  AdminNotifyEvent,
  DEFAULT_ADMIN_NOTIFY_EVENTS,
} from './notification.constants';

@Injectable()
export class AdminNotifyService implements OnModuleInit {
  private readonly logger = new Logger(AdminNotifyService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
  ) {}

  async onModuleInit() {
    const settings = await this.prisma.storeSettings.findUnique({ where: { id: 'default' } });
    if (settings && !settings.adminNotifyEventsJson) {
      await this.prisma.storeSettings.update({
        where: { id: 'default' },
        data: { adminNotifyEventsJson: DEFAULT_ADMIN_NOTIFY_EVENTS },
      });
    }
  }

  async getSettings() {
    const s = await this.prisma.storeSettings.findUniqueOrThrow({ where: { id: 'default' } });
    const events = {
      ...DEFAULT_ADMIN_NOTIFY_EVENTS,
      ...((s.adminNotifyEventsJson as Record<string, boolean>) ?? {}),
    };
    return {
      admin_notify_phone_1: s.adminNotifyPhone1,
      admin_notify_phone_2: s.adminNotifyPhone2,
      admin_notify_events: events,
      inactivity_reminder_days: s.inactivityReminderDays,
      inactivity_reminder_enabled: s.inactivityReminderEnabled,
    };
  }

  async updateSettings(data: {
    adminNotifyPhone1?: string | null;
    adminNotifyPhone2?: string | null;
    adminNotifyEvents?: Partial<Record<AdminNotifyEvent, boolean>>;
    inactivityReminderDays?: number;
    inactivityReminderEnabled?: boolean;
  }) {
    const current = await this.getSettings();
    const events = { ...current.admin_notify_events, ...data.adminNotifyEvents };
    return this.prisma.storeSettings.update({
      where: { id: 'default' },
      data: {
        adminNotifyPhone1: data.adminNotifyPhone1,
        adminNotifyPhone2: data.adminNotifyPhone2,
        adminNotifyEventsJson: events,
        inactivityReminderDays: data.inactivityReminderDays,
        inactivityReminderEnabled: data.inactivityReminderEnabled,
      },
    });
  }

  async notify(event: AdminNotifyEvent, vars: Record<string, string>) {
    if (!this.whatsapp.isEnabled()) return;

    const settings = await this.getSettings();
    if (!settings.admin_notify_events[event]) return;

    const phones = [settings.admin_notify_phone_1, settings.admin_notify_phone_2].filter(Boolean) as string[];
    if (phones.length === 0) return;

    const templateKey = ADMIN_NOTIFY_TEMPLATE_KEYS[event];
    for (const phone of phones) {
      try {
        await this.whatsapp.sendTemplate(templateKey, phone, vars, vars.pedido_id);
      } catch (err) {
        this.logger.warn(`Admin notify ${event} falhou para ${phone.slice(-4)}`);
      }
    }
  }
}
