import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DeliveryZonesService } from './delivery-zones.service';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryRouteService } from './delivery-route.service';
import { DriverAuthService } from './driver-auth.service';
import { JwtAuthGuard } from '../common/guards';

@Controller('admin/delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryAdminController {
  constructor(
    private zones: DeliveryZonesService,
    private delivery: DeliveryService,
    private prisma: PrismaService,
    private deliveryRoute: DeliveryRouteService,
    private driverAuth: DriverAuthService,
  ) {}

  @Get('zones')
  listZones() {
    return this.zones.listAdmin();
  }

  @Post('zones')
  createZone(@Body() body: Parameters<DeliveryZonesService['create']>[0]) {
    return this.zones.create(body);
  }

  @Patch('zones/:id')
  updateZone(@Param('id') id: string, @Body() body: Parameters<DeliveryZonesService['update']>[1]) {
    return this.zones.update(id, body);
  }

  @Delete('zones/:id')
  deleteZone(@Param('id') id: string) {
    return this.zones.delete(id);
  }

  @Post('zones/import')
  importZones(@Body() body: { csv: string }) {
    return this.zones.importFromCsv(body.csv);
  }

  @Get('zones/export')
  exportZones() {
    return this.zones.exportCsv().then((csv) => ({ csv }));
  }

  @Get('blocks')
  listBlocks() {
    return this.prisma.deliveryBlock.findMany({ orderBy: { blockDate: 'asc' } });
  }

  @Post('blocks')
  createBlock(@Body() body: { block_date: string; reason?: string }) {
    return this.prisma.deliveryBlock.create({
      data: { blockDate: new Date(body.block_date), reason: body.reason },
    });
  }

  @Delete('blocks/:id')
  deleteBlock(@Param('id') id: string) {
    return this.prisma.deliveryBlock.delete({ where: { id } });
  }

  @Get('windows')
  listWindows() {
    return this.delivery.listWindowsAdmin();
  }

  @Patch('windows/:id')
  updateWindow(
    @Param('id') id: string,
    @Body()
    body: {
      label?: string;
      cutoff_hour?: number;
      order_deadline_days_before?: number;
      active?: boolean;
    },
  ) {
    return this.delivery.updateWindow(id, {
      label: body.label,
      cutoffHour: body.cutoff_hour,
      orderDeadlineDaysBefore: body.order_deadline_days_before,
      active: body.active,
    });
  }

  @Get('depot')
  getDepot() {
    return this.deliveryRoute.getDepot();
  }

  @Patch('depot')
  updateDepot(
    @Body()
    body: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zip_code?: string;
    },
  ) {
    return this.deliveryRoute.updateDepot(body);
  }

  @Get('driver-pin/status')
  driverPinStatus() {
    return this.driverAuth.getPinStatus();
  }

  @Patch('driver-pin')
  setDriverPin(@Body() body: { pin: string }) {
    return this.driverAuth.setPin(body.pin);
  }
}
