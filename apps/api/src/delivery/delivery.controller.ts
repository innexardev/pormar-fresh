import { Controller, Get, Param, Query } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryZonesService } from './delivery-zones.service';

@Controller('public/delivery')
export class DeliveryController {
  constructor(
    private delivery: DeliveryService,
    private zones: DeliveryZonesService,
  ) {}

  @Get('windows')
  windows() {
    return this.delivery.getAvailableWindows();
  }

  @Get('cep/:cep')
  lookupCep(@Param('cep') cep: string) {
    return this.zones.lookupCep(cep);
  }

  @Get('quote')
  quote(
    @Query('zip_code') zipCode: string,
    @Query('neighborhood') neighborhood?: string,
  ) {
    return this.zones.quoteAddress({ zip_code: zipCode, neighborhood });
  }

  @Get('zones')
  publicZones() {
    return this.zones.listPublic();
  }
}
