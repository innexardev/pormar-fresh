import { Controller, Get } from '@nestjs/common';
import { StoreService } from './store.service';

@Controller('public/store')
export class StoreController {
  constructor(private store: StoreService) {}

  @Get()
  info() {
    return this.store.getPublicInfo();
  }
}
