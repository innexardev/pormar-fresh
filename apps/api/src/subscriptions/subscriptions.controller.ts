import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards';

@Controller()
export class SubscriptionsController {
  constructor(private subscriptions: SubscriptionsService) {}

  @Post('public/subscriptions')
  create(@Body() body: Parameters<SubscriptionsService['create']>[0]) {
    return this.subscriptions.create(body);
  }

  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard)
  list(@Query('status') status?: string) {
    return this.subscriptions.listAdmin(status);
  }

  @Patch('admin/subscriptions/:id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() body: { status: 'active' | 'paused' | 'cancelled' }) {
    return this.subscriptions.updateStatus(id, body.status);
  }

  @Post('admin/subscriptions/generate-orders')
  @UseGuards(JwtAuthGuard)
  generateOrders() {
    return this.subscriptions.generateWeeklyOrders();
  }
}
