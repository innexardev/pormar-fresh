import { Body, Controller, Get, Param, Post, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { DeliveryRouteService } from '../delivery/delivery-route.service';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/driver')
@UseGuards(JwtAuthGuard)
export class DriverController {
  constructor(
    private deliveryRoute: DeliveryRouteService,
    private orders: OrdersService,
    private prisma: PrismaService,
  ) {}

  @Get('route')
  driverRoute(
    @Query('delivery_date') deliveryDate: string,
    @Query('optimize') optimize?: string,
  ) {
    return this.deliveryRoute.getRoute(deliveryDate, optimize !== 'false');
  }

  @Post('orders/:id/start')
  startDelivery(@Param('id') id: string) {
    return this.orders.updateStatus(id, 'out_for_delivery');
  }

  @Post('orders/:id/complete')
  async completeDelivery(
    @Param('id') id: string,
    @Body() body: { proof_url?: string; notes?: string },
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido nao encontrado');

    if (body.proof_url || body.notes) {
      await this.prisma.order.update({
        where: { id },
        data: {
          deliveryProofUrl: body.proof_url ?? order.deliveryProofUrl,
          notes: body.notes
            ? [order.notes, `[Entrega] ${body.notes}`].filter(Boolean).join(' | ')
            : order.notes,
        },
      });
    }

    await this.prisma.order.update({
      where: { id },
      data: { deliveryCompletedAt: new Date() },
    });

    return this.orders.updateStatus(id, 'delivered');
  }
}
