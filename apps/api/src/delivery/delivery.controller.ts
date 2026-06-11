import { Controller, Get } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('public/delivery')
export class DeliveryController {
  constructor(private delivery: DeliveryService) {}

  @Get('windows')
  windows() {
    return this.delivery.getAvailableWindows();
  }
}
