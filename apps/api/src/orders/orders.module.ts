import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DriverController } from './driver.controller';
import { StoreModule } from '../store/store.module';
import { PricingModule } from '../pricing/pricing.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { PromoModule } from '../promo/promo.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [StoreModule, PricingModule, forwardRef(() => DeliveryModule), PromoModule, NotificationsModule, forwardRef(() => PaymentsModule)],
  controllers: [OrdersController, DriverController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
