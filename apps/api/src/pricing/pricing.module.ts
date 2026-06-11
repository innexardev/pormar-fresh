import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PricingAlertsService } from './pricing-alerts.service';
import { PricingReportsService } from './pricing-reports.service';
import { BomService } from './bom.service';

@Module({
  controllers: [PricingController],
  providers: [PricingService, PricingAlertsService, PricingReportsService, BomService],
  exports: [PricingService, PricingAlertsService, PricingReportsService, BomService],
})
export class PricingModule {}