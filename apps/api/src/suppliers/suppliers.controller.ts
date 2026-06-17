import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards';
import { PurchaseInvoicesService, SuppliersService } from './suppliers.service';

@Controller('admin/suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private suppliers: SuppliersService) {}

  @Get()
  list(@Query('search') search?: string) {
    return this.suppliers.list(search);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.suppliers.get(id);
  }

  @Post()
  create(@Body() body: Parameters<SuppliersService['create']>[0]) {
    return this.suppliers.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Parameters<SuppliersService['update']>[1]) {
    return this.suppliers.update(id, body);
  }

  @Post(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.suppliers.delete(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.suppliers.delete(id);
  }
}

@Controller('admin/purchase-invoices')
@UseGuards(JwtAuthGuard)
export class PurchaseInvoicesController {
  constructor(private invoices: PurchaseInvoicesService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.invoices.list(status);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.invoices.get(id);
  }

  @Post('upload-xml')
  @UseInterceptors(FileInterceptor('file'))
  async uploadXml(@UploadedFile() file: Express.Multer.File) {
    const xml = file.buffer.toString('utf-8');
    return this.invoices.createFromXml(xml);
  }

  @Post('upload-xml-text')
  uploadXmlText(@Body() body: { xml: string }) {
    return this.invoices.createFromXml(body.xml);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string; notes?: string }) {
    return this.invoices.updateStatus(id, body.status, body.notes);
  }
}
