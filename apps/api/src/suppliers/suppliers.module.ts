import { Module } from '@nestjs/common';
import { SuppliersController, PurchaseInvoicesController } from './suppliers.controller';
import { SuppliersService, PurchaseInvoicesService } from './suppliers.service';

@Module({
  controllers: [SuppliersController, PurchaseInvoicesController],
  providers: [SuppliersService, PurchaseInvoicesService],
  exports: [SuppliersService, PurchaseInvoicesService],
})
export class SuppliersModule {}
