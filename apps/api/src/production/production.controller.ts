import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { ProductionService } from './production.service';

@Controller('admin/production')
@UseGuards(JwtAuthGuard)
export class ProductionController {
  constructor(private production: ProductionService) {}

  @Get('plans')
  listPlans() {
    return this.production.listPlans();
  }

  @Get('plans/:id')
  getPlan(@Param('id') id: string) {
    return this.production.getPlan(id);
  }

  @Get('upcoming')
  upcoming() {
    return this.production.upcomingSlots();
  }

  @Post('generate')
  generate(@Body() body: { delivery_window_id: string; delivery_date: string }) {
    return this.production.generatePlan(body.delivery_window_id, body.delivery_date);
  }

  @Patch('plans/:id/finalize')
  finalize(@Param('id') id: string) {
    return this.production.finalizePlan(id);
  }
}
