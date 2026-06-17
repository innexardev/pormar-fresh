import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { SystemService } from './system.service';
import { StoreModule } from '../store/store.module';
import { StorageModule } from '../storage/storage.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [StoreModule, StorageModule, PaymentsModule, NotificationsModule],
  controllers: [AdminController, StaffController],
  providers: [AdminService, StaffService, SystemService],
})
export class AdminModule {}
