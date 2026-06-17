import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { PushService } from './push.service';
import { MessageTemplateService } from './message-template.service';
import { WhatsappAdminController } from './whatsapp-admin.controller';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';
import { PushController } from './push.controller';
import { AdminNotifyService } from './admin-notify.service';
import { BotMenuService } from './bot-menu.service';
import { SupportService } from './support.service';
import { EngagementService } from './engagement.service';
import { WhatsappBotService } from './whatsapp-bot.service';
import { MessagingAdminController } from './messaging-admin.controller';

@Module({
  controllers: [
    WhatsappAdminController,
    WhatsappWebhookController,
    PushController,
    MessagingAdminController,
  ],
  providers: [
    WhatsappService,
    PushService,
    MessageTemplateService,
    AdminNotifyService,
    BotMenuService,
    SupportService,
    EngagementService,
    WhatsappBotService,
  ],
  exports: [
    WhatsappService,
    PushService,
    MessageTemplateService,
    AdminNotifyService,
    SupportService,
    EngagementService,
  ],
})
export class NotificationsModule {}
