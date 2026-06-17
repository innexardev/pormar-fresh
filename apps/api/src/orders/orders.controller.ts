import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { DriverLocationService } from '../delivery/driver-location.service';
import { JwtAuthGuard } from '../common/guards';

@Controller()
export class OrdersController {
  constructor(
    private orders: OrdersService,
    private payments: PaymentsService,
    private driverLocation: DriverLocationService,
  ) {}

  @Post('public/orders')
  create(@Body() body: Parameters<OrdersService['createOrder']>[0]) {
    return this.orders.createOrder(body);
  }

  @Get('public/orders/:id')
  getOne(@Param('id') id: string) {
    return this.orders.getOrder(id);
  }

  @Get('public/orders/:id/tracking')
  getTracking(@Param('id') id: string) {
    return this.driverLocation.getTrackingForOrder(id);
  }

  @Get('admin/orders/export')
  @UseGuards(JwtAuthGuard)
  async export(
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const csv = await this.orders.exportCsv(status, from, to);
    return { csv };
  }

  @Get('admin/orders/separation-list')
  @UseGuards(JwtAuthGuard)
  separationList(
    @Query('delivery_date') deliveryDate?: string,
    @Query('status') status?: string,
  ) {
    const statuses = status ? status.split(',').map((s) => s.trim()) : undefined;
    return this.orders.getSeparationList(deliveryDate, statuses);
  }

  @Get('admin/orders/delivery-route')
  @UseGuards(JwtAuthGuard)
  deliveryRoute(
    @Query('delivery_date') deliveryDate: string,
    @Query('optimize') optimize?: string,
  ) {
    if (!deliveryDate) {
      throw new BadRequestException('delivery_date obrigatorio');
    }
    return this.orders.getDeliveryRoute(deliveryDate, optimize !== 'false');
  }

  @Get('admin/orders/:id')
  @UseGuards(JwtAuthGuard)
  getAdminOne(@Param('id') id: string) {
    return this.orders.getAdminOrder(id);
  }

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard)
  list(@Query('status') status?: string, @Query('delivery_date') deliveryDate?: string) {
    return this.orders.listAdmin(status, deliveryDate);
  }

  @Patch('admin/orders/bulk-status')
  @UseGuards(JwtAuthGuard)
  updateStatusBulk(@Body() body: { order_ids: string[]; status: string }) {
    if (!body.order_ids?.length) {
      throw new BadRequestException('Selecione ao menos um pedido');
    }
    if (!body.status) {
      throw new BadRequestException('Status obrigatorio');
    }
    return this.orders.updateStatusBulk(body.order_ids, body.status);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.orders.updateStatus(id, body.status);
  }

  @Post('admin/orders/:id/whatsapp/resend')
  @UseGuards(JwtAuthGuard)
  resendWhatsapp(@Param('id') id: string) {
    return this.orders.resendTrackingLink(id);
  }

  @Post('admin/orders/:id/confirm-payment')
  @UseGuards(JwtAuthGuard)
  confirmPayment(@Param('id') id: string) {
    return this.payments.confirmPayment(id);
  }
}
