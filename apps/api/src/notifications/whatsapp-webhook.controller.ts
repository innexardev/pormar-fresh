import { Body, Controller, Post } from '@nestjs/common';
import { WhatsappBotService } from './whatsapp-bot.service';

@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  constructor(private bot: WhatsappBotService) {}

  @Post()
  async handle(@Body() body: Record<string, unknown>) {
    const event = body.event as string | undefined;
    const data = body.data as Record<string, unknown> | undefined;

    if (event === 'messages.upsert' && data) {
      const msg = data.message as Record<string, unknown> | undefined;
      const key = data.key as Record<string, unknown> | undefined;
      const fromMe = key?.fromMe === true;
      if (fromMe) return { ok: true };

      const remoteJid = String(key?.remoteJid ?? '');
      const phone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '').slice(-11);
      const text =
        (msg?.conversation as string) ??
        ((msg?.extendedTextMessage as Record<string, unknown>)?.text as string) ??
        '';

      if (!phone || !text.trim()) return { ok: true };

      await this.bot.handleInbound(phone, text.trim());
    }

    return { ok: true };
  }
}
