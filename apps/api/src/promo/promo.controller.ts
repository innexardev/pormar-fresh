import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PromoService } from './promo.service';
import { JwtAuthGuard } from '../common/guards';

@Controller()
export class PromoController {
  constructor(private promo: PromoService) {}

  @Post('public/promo/validate')
  validate(@Body() body: { code: string; subtotal: number }) {
    return this.promo.validate(body.code, body.subtotal as never).then((r) => ({
      valid: true,
      discount: Number(r.discount),
      code: r.promoCode,
    }));
  }

  @Get('admin/promo-codes')
  @UseGuards(JwtAuthGuard)
  list() {
    return this.promo.listAdmin();
  }

  @Post('admin/promo-codes')
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Parameters<PromoService['create']>[0]) {
    return this.promo.create(body);
  }

  @Patch('admin/promo-codes/:id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: Parameters<PromoService['update']>[1]) {
    return this.promo.update(id, body);
  }

  @Delete('admin/promo-codes/:id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.promo.delete(id);
  }
}
