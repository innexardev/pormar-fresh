import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { StoreModule } from '../store/store.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [StoreModule, PricingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
