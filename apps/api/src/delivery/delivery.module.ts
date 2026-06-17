import { Module, forwardRef } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryZonesService } from './delivery-zones.service';
import { DeliveryController } from './delivery.controller';
import { DeliveryAdminController } from './delivery-admin.controller';
import { GeocodingService } from './geocoding.service';
import { DeliveryRouteService } from './delivery-route.service';
import { GoogleRoutesService } from './google-routes.service';
import { DriverAuthService } from './driver-auth.service';
import { DriverLocationService } from './driver-location.service';
import { ChecklistService } from './checklist.service';
import { DriverAppController, DriverAuthController } from './driver-app.controller';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, forwardRef(() => OrdersModule)],
  controllers: [DeliveryController, DeliveryAdminController, DriverAppController, DriverAuthController],
  providers: [
    DeliveryService,
    DeliveryZonesService,
    GeocodingService,
    GoogleRoutesService,
    DeliveryRouteService,
    DriverAuthService,
    DriverLocationService,
    ChecklistService,
  ],
  exports: [
    DeliveryService,
    DeliveryZonesService,
    GeocodingService,
    GoogleRoutesService,
    DeliveryRouteService,
    DriverLocationService,
    ChecklistService,
    DriverAuthService,
  ],
})
export class DeliveryModule {}
