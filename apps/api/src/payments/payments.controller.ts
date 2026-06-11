import { Controller, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('public/orders')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post(':orderId/payments/pix')
  pix(@Param('orderId') orderId: string) {
    return this.payments.createPix(orderId);
  }

  @Post(':orderId/payments/simulate')
  simulate(@Param('orderId') orderId: string) {
    return this.payments.simulatePayment(orderId);
  }
}
