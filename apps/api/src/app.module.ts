import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppThrottlerGuard } from './common/throttler.guard';
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
import { StorageModule } from './storage/storage.module';
import { PromoModule } from './promo/promo.module';
import { NotificationsModule } from './notifications/notifications.module';

import { SubscriptionsModule } from './subscriptions/subscriptions.module';

import { CustomerAuthModule } from './customer-auth/customer-auth.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
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
    StorageModule,
    PromoModule,
    NotificationsModule,
    SubscriptionsModule,
    CustomerAuthModule,
    SuppliersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule {}
