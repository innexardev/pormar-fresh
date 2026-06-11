import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards';

@Controller()
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post('public/orders')
  create(@Body() body: Parameters<OrdersService['createOrder']>[0]) {
    return this.orders.createOrder(body);
  }

  @Get('public/orders/:id')
  getOne(@Param('id') id: string) {
    return this.orders.getOrder(id);
  }

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard)
  list(@Query('status') status?: string) {
    return this.orders.listAdmin(status);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.orders.updateStatus(id, body.status);
  }
}
