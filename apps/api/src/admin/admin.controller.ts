import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards';
import { StoreService } from '../store/store.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private admin: AdminService, private store: StoreService) {}

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

  @Get('categories')
  categories() {
    return this.admin.listCategories();
  }

  @Get('site-content')
  siteContent() {
    return this.store.getSiteContent();
  }

  @Patch('site-content')
  updateSiteContent(@Body() body: Parameters<StoreService['updateSiteContent']>[0]) {
    return this.store.updateSiteContent(body);
  }
}
