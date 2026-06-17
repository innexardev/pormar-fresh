import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../common/guards';
import { MessageTemplateService } from './message-template.service';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappAdminController {
  constructor(
    private whatsapp: WhatsappService,
    private templates: MessageTemplateService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  @Get('status')
  async status() {
    const conn = await this.whatsapp.getConnectionState();
    const domain = this.config.get('DOMAIN') || 'onnshoppe.com';
    return {
      enabled: this.whatsapp.isEnabled(),
      manager_url: `https://evolution.${domain}/manager`,
      ...conn,
    };
  }

  @Get('qrcode')
  async qrcode() {
    return this.whatsapp.fetchQrCode();
  }

  @Post('restart')
  restart() {
    return this.whatsapp.restartInstance();
  }

  @Post('test')
  async test(@Body() body: { phone: string; message?: string }) {
    const text = body.message ?? 'Teste Pomar Fresh — WhatsApp conectado com sucesso!';
    await this.whatsapp.sendText(body.phone, text, 'test');
    return { ok: true };
  }

  @Get('logs')
  logs() {
    return this.prisma.whatsappMessageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Get('templates')
  listTemplates(@Query('category') category?: string) {
    return this.templates.list(category);
  }

  @Patch('templates/:key')
  updateTemplate(
    @Param('key') key: string,
    @Body() body: { body?: string; active?: boolean; label?: string },
  ) {
    return this.templates.update(key, body);
  }
}
