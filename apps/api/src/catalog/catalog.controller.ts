import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('public')
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Get('menu')
  menu() {
    return this.catalog.getMenu();
  }

  @Get('combos/:id')
  combo(@Param('id') id: string) {
    return this.catalog.getCombo(id);
  }
}
