import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { PricingService } from './pricing.service';
import { PricingAlertsService } from './pricing-alerts.service';
import { PricingReportsService } from './pricing-reports.service';

@Controller('admin/pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(
    private pricing: PricingService,
    private alerts: PricingAlertsService,
    private reportsService: PricingReportsService,
  ) {}
  @Get('dashboard')
  dashboard() {
    return this.pricing.dashboard();
  }

  @Get('settings')
  settings() {
    return this.pricing.getSettingsPublic();
  }

  @Patch('settings')
  updateSettings(@Body() body: Record<string, unknown>) {
    return this.pricing.updateSettings(body as Parameters<PricingService['updateSettings']>[0]);
  }

  @Get('ingredients')
  listIngredients() {
    return this.pricing.listIngredients();
  }

  @Post('ingredients')
  createIngredient(@Body() body: Parameters<PricingService['createIngredient']>[0]) {
    return this.pricing.createIngredient(body);
  }

  @Patch('ingredients/:id')
  updateIngredient(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.pricing.updateIngredient(id, body as Parameters<PricingService['updateIngredient']>[1]);
  }

  @Delete('ingredients/:id')
  deleteIngredient(@Param('id') id: string) {
    return this.pricing.deleteIngredient(id);
  }

  @Post('ingredients/:id/purchases')
  registerPurchase(@Param('id') id: string, @Body() body: Parameters<PricingService['registerPurchase']>[1]) {
    return this.pricing.registerPurchase(id, body);
  }

  @Get('ingredients/:id/purchases')
  listPurchases(@Param('id') id: string) {
    return this.pricing.listPurchases(id);
  }

  @Post('ingredients/:id/yields')
  registerYield(@Param('id') id: string, @Body() body: Parameters<PricingService['registerYield']>[1]) {
    return this.pricing.registerYield(id, body);
  }

  @Get('packaging')
  listPackaging() {
    return this.pricing.listPackaging();
  }

  @Post('packaging')
  createPackaging(@Body() body: Parameters<PricingService['createPackaging']>[0]) {
    return this.pricing.createPackaging(body);
  }

  @Patch('packaging/:id')
  updatePackaging(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.pricing.updatePackaging(id, body as Parameters<PricingService['updatePackaging']>[1]);
  }

  @Delete('packaging/:id')
  deletePackaging(@Param('id') id: string) {
    return this.pricing.deletePackaging(id);
  }

  @Get('recipes')
  listRecipes() {
    return this.pricing.listRecipes();
  }

  @Post('recipes')
  createRecipe(@Body() body: Parameters<PricingService['createRecipe']>[0]) {
    return this.pricing.createRecipe(body);
  }

  @Patch('recipes/:id')
  updateRecipe(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.pricing.updateRecipe(id, body as Parameters<PricingService['updateRecipe']>[1]);
  }

  @Delete('recipes/:id')
  deleteRecipe(@Param('id') id: string) {
    return this.pricing.deleteRecipe(id);
  }

  @Post('recipes/:id/simulate')
  simulate(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.pricing.simulateRecipe(id, body as Parameters<PricingService['simulateRecipe']>[1]);
  }

  @Post('recipes/:id/apply-price')
  applyPrice(@Param('id') id: string) {
    return this.pricing.applyRecipePrice(id);
  }

  @Get('reports')
  getReports(@Query('weeks') weeks?: string) {
    return this.reportsService.fullReport(weeks ? Number(weeks) : 8);
  }

  @Get('alerts')
  listAlerts(@Query('all') all?: string) {
    return this.alerts.listAlerts(all !== 'true');
  }

  @Post('alerts/scan')
  scanAlerts() {
    return this.alerts.scanAll();
  }

  @Patch('alerts/:id/read')
  markAlertRead(@Param('id') id: string) {
    return this.alerts.markRead(id);
  }

  @Patch('alerts/read-all')
  markAllAlertsRead() {
    return this.alerts.markAllRead();
  }

  @Get('ingredients/:id/movements')
  ingredientMovements(@Param('id') id: string) {
    return this.pricing.listIngredientMovements(id);
  }
}
