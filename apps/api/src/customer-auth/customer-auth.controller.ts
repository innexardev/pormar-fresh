import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerJwtGuard } from './customer-jwt.guard';

@Controller('public/auth')
export class CustomerAuthController {
  constructor(private auth: CustomerAuthService) {}

  @Post('otp/request')
  requestOtp(@Body() body: { phone: string }) {
    return this.auth.requestOtp(body.phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() body: { phone: string; code: string }) {
    return this.auth.verifyOtp(body.phone, body.code);
  }

  @Get('me/orders')
  @UseGuards(CustomerJwtGuard)
  myOrders(@Req() req: { user: { userId: string } }) {
    return this.auth.getMyOrders(req.user.userId);
  }
}
