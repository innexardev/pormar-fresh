import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [StoreModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
