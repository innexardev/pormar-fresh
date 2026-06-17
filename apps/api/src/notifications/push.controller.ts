import { Body, Controller, Get, Post } from '@nestjs/common';
import { PushService } from './push.service';

@Controller('public/push')
export class PushController {
  constructor(private push: PushService) {}

  @Get('vapid-key')
  vapidKey() {
    return { public_key: this.push.getPublicKey(), enabled: this.push.isEnabled() };
  }

  @Post('subscribe')
  subscribe(@Body() body: { endpoint: string; keys: { p256dh: string; auth: string }; phone?: string }) {
    return this.push.subscribe(body);
  }
}
