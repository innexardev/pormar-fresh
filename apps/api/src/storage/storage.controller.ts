import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Body,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../common/guards';
import { AdminOrDriverGuard } from '../common/driver.guards';

@Controller('admin/uploads')
@UseGuards(AdminOrDriverGuard)
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private storage: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatorio');
    if (!this.storage.isEnabled()) {
      throw new BadRequestException('MinIO nao configurado — use URL externa ou configure S3_ENDPOINT');
    }
    const safeFolder = (folder || 'misc').replace(/[^a-z0-9-_]/gi, '');
    try {
      return await this.storage.uploadFile(file, safeFolder);
    } catch (err) {
      this.logger.error(err);
      const msg = err instanceof Error ? err.message : 'Falha no upload';
      if (msg.includes('nao permitido') || msg.includes('maximo')) {
        throw new BadRequestException(msg);
      }
      throw new InternalServerErrorException('Falha ao enviar imagem. Tente novamente.');
    }
  }
}
