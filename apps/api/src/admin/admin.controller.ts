import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../common/guards';
import { StoreService } from '../store/store.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private admin: AdminService,
    private store: StoreService,
    private system: SystemService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboardStats();
  }

  @Get('products')
  products() {
    return this.admin.listProducts();
  }

  @Post('products')
  createProduct(@Body() body: Parameters<AdminService['createProduct']>[0]) {
    return this.admin.createProduct(body);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.admin.updateProduct(id, body as Parameters<AdminService['updateProduct']>[1]);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.admin.deleteProduct(id);
  }

  @Post('products/:id/stock')
  adjustStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; type: 'in' | 'adjustment'; reason?: string },
  ) {
    return this.admin.adjustStock(id, body.quantity, body.type, body.reason);
  }

  @Get('stock/movements')
  movements(@Query('productId') productId?: string) {
    return this.admin.listStockMovements(productId);
  }

  @Get('stock/low')
  lowStock() {
    return this.admin.listLowStock();
  }

  @Get('combos')
  combos() {
    return this.admin.listCombos();
  }

  @Post('combos')
  createCombo(@Body() body: Parameters<AdminService['createCombo']>[0]) {
    return this.admin.createCombo(body);
  }

  @Patch('combos/:id')
  updateCombo(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.admin.updateCombo(id, body as Parameters<AdminService['updateCombo']>[1]);
  }

  @Delete('combos/:id')
  deleteCombo(@Param('id') id: string) {
    return this.admin.deleteCombo(id);
  }

  @Get('categories')
  categories() {
    return this.admin.listCategories();
  }

  @Get('customers')
  customers(@Query('search') search?: string) {
    return this.admin.listCustomers(search);
  }

  @Get('site-content')
  siteContent() {
    return this.store.getSiteContent();
  }

  @Patch('site-content')
  updateSiteContent(@Body() body: Parameters<StoreService['updateSiteContent']>[0]) {
    return this.store.updateSiteContent(body);
  }

  @Get('store-settings')
  storeSettings() {
    return this.store.getAdminSettings();
  }

  @Patch('store-settings')
  updateStoreSettings(@Body() body: Parameters<StoreService['updateAdminSettings']>[0]) {
    return this.store.updateAdminSettings(body);
  }

  @Get('system/status')
  systemStatus() {
    return this.system.getStatus();
  }
}
