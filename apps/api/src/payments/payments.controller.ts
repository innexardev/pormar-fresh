import { Body, Controller, Param, Post, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';

@Controller('public/orders')
export class PaymentsController {
  constructor(
    private payments: PaymentsService,
    private config: ConfigService,
  ) {}

  @Post(':orderId/payments/pix')
  pix(@Param('orderId') orderId: string) {
    return this.payments.createPix(orderId);
  }

  @Post(':orderId/payments/simulate')
  simulate(@Param('orderId') orderId: string) {
    if (this.config.get('NODE_ENV') === 'production' && this.config.get('ALLOW_PIX_SIMULATE') !== 'true') {
      throw new ForbiddenException('Simulacao desabilitada em producao');
    }
    return this.payments.simulatePayment(orderId);
  }
}
