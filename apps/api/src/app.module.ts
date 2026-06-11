import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { DeliveryModule } from './delivery/delivery.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { StoreModule } from './store/store.module';
import { PricingModule } from './pricing/pricing.module';
import { ProductionModule } from './production/production.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StoreModule,
    CatalogModule,
    DeliveryModule,
    OrdersModule,
    PaymentsModule,
    AdminModule,
    PricingModule,
    ProductionModule,
  ],
})
export class AppModule {}
