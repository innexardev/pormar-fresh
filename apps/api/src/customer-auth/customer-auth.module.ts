import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [CustomerAuthController],
  providers: [CustomerAuthService],
  exports: [CustomerAuthService],
})
export class CustomerAuthModule {}
