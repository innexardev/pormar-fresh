import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { AsaasService } from './asaas.service';

@SkipThrottle()
@Controller('webhooks')
export class AsaasWebhookController {
  constructor(
    private payments: PaymentsService,
    private asaas: AsaasService,
  ) {}

  @Post('asaas')
  @HttpCode(200)
  async handle(@Body() body: { event?: string; payment?: { id?: string; externalReference?: string } }, @Headers('asaas-access-token') token?: string) {
    if (!this.asaas.verifyWebhookToken(token)) {
      return { ok: false, reason: 'invalid_token' };
    }
    const event = body.event ?? '';
    if (!this.asaas.isPaidEvent(event)) {
      return { ok: true, ignored: true };
    }
    const externalRef = body.payment?.externalReference;
    if (!externalRef?.startsWith('order:')) {
      return { ok: true, ignored: true };
    }
    const orderId = externalRef.replace('order:', '');
    await this.payments.confirmPayment(orderId, body.payment?.id);
    return { ok: true };
  }
}
