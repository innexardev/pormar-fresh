import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { DriverJwtGuard } from '../common/driver.guards';
import { DriverAuthService } from './driver-auth.service';
import { DeliveryRouteService } from './delivery-route.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { DriverLocationService } from './driver-location.service';
import { ChecklistService } from './checklist.service';

@Controller('driver')
export class DriverAppController {
  constructor(
    private deliveryRoute: DeliveryRouteService,
    private orders: OrdersService,
    private prisma: PrismaService,
    private location: DriverLocationService,
    private checklist: ChecklistService,
  ) {}

  @Get('route')
  @UseGuards(DriverJwtGuard)
  route(
    @Query('delivery_date') deliveryDate: string,
    @Query('optimize') optimize?: string,
  ) {
    return this.deliveryRoute.getRoute(deliveryDate, optimize !== 'false');
  }

  @Post('location')
  @UseGuards(DriverJwtGuard)
  updateLocation(@Body() body: { lat: number; lng: number; active_order_id?: string }) {
    return this.location.updateLocation(body.lat, body.lng, body.active_order_id);
  }

  @Get('orders/:id/checklist')
  @UseGuards(DriverJwtGuard)
  getChecklist(@Param('id') id: string) {
    return this.checklist.ensureForOrder(id);
  }

  @Patch('orders/:id/checklist')
  @UseGuards(DriverJwtGuard)
  toggleChecklist(
    @Param('id') id: string,
    @Body() body: { item_index: number; checked: boolean },
  ) {
    return this.checklist.toggle(id, body.item_index, body.checked);
  }

  @Post('orders/:id/start')
  @UseGuards(DriverJwtGuard)
  async startDelivery(@Param('id') id: string, @Body() body?: { lat?: number; lng?: number }) {
    if (body?.lat != null && body?.lng != null) {
      await this.location.updateLocation(body.lat, body.lng, id);
    } else {
      await this.prisma.driverLiveState.upsert({
        where: { id: 'default' },
        create: { id: 'default', activeOrderId: id },
        update: { activeOrderId: id },
      });
    }
    return this.orders.updateStatus(id, 'out_for_delivery');
  }

  @Post('orders/:id/complete')
  @UseGuards(DriverJwtGuard)
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

    const live = await this.location.getLiveState();
    if (live?.activeOrderId === id) {
      await this.location.clearActiveOrder();
    }

    return this.orders.updateStatus(id, 'delivered');
  }
}

@Controller('driver/auth')
export class DriverAuthController {
  constructor(private auth: DriverAuthService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  login(@Body() body: { pin: string }) {
    if (!body.pin) throw new BadRequestException('PIN obrigatorio');
    return this.auth.login(body.pin);
  }
}
