import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AsaasWebhookController } from './asaas-webhook.controller';
import { AsaasService } from './asaas.service';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => OrdersModule), NotificationsModule],
  controllers: [PaymentsController, AsaasWebhookController],
  providers: [PaymentsService, AsaasService],
  exports: [PaymentsService, AsaasService],
})
export class PaymentsModule {}
