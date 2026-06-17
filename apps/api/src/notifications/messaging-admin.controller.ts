import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { AdminNotifyService } from './admin-notify.service';
import { BotMenuService } from './bot-menu.service';
import { EngagementService } from './engagement.service';
import { SupportService } from './support.service';
import { AdminNotifyEvent } from './notification.constants';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class MessagingAdminController {
  constructor(
    private adminNotify: AdminNotifyService,
    private support: SupportService,
    private botMenu: BotMenuService,
    private engagement: EngagementService,
  ) {}

  @Get('team-notifications')
  getTeamSettings() {
    return this.adminNotify.getSettings();
  }

  @Patch('team-notifications')
  async updateTeamSettings(
    @Body()
    body: {
      admin_notify_phone_1?: string | null;
      admin_notify_phone_2?: string | null;
      admin_notify_events?: Partial<Record<AdminNotifyEvent, boolean>>;
      inactivity_reminder_days?: number;
      inactivity_reminder_enabled?: boolean;
    },
  ) {
    await this.adminNotify.updateSettings({
      adminNotifyPhone1: body.admin_notify_phone_1,
      adminNotifyPhone2: body.admin_notify_phone_2,
      adminNotifyEvents: body.admin_notify_events,
      inactivityReminderDays: body.inactivity_reminder_days,
      inactivityReminderEnabled: body.inactivity_reminder_enabled,
    });
    return this.adminNotify.getSettings();
  }

  @Post('engagement/run-reminders')
  runReminders() {
    return this.engagement.runInactivityReminders();
  }

  @Get('support/tickets')
  listTickets(@Query('status') status?: string) {
    return this.support.list(status);
  }

  @Get('support/tickets/count')
  async ticketCount() {
    return { open: await this.support.openCount() };
  }

  @Get('support/tickets/:id')
  getTicket(@Param('id') id: string) {
    return this.support.get(id);
  }

  @Post('support/tickets/:id/reply')
  reply(@Param('id') id: string, @Body() body: { message: string }) {
    return this.support.reply(id, body.message);
  }

  @Patch('support/tickets/:id/status')
  updateTicketStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.support.updateStatus(id, body.status);
  }

  @Get('bot-menu')
  listBotMenu() {
    return this.botMenu.list();
  }

  @Patch('bot-menu/:id')
  updateBotMenu(
    @Param('id') id: string,
    @Body() body: { label?: string; responseText?: string; active?: boolean; sortOrder?: number },
  ) {
    return this.botMenu.update(id, body);
  }
}
