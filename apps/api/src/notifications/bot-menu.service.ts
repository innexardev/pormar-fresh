import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_BOT_MENU_OPTIONS } from './notification.constants';

@Injectable()
export class BotMenuService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    for (const opt of DEFAULT_BOT_MENU_OPTIONS) {
      await this.prisma.botMenuOption.upsert({
        where: { trigger: opt.trigger },
        update: { label: opt.label, action: opt.action, sortOrder: opt.sortOrder },
        create: {
          trigger: opt.trigger,
          label: opt.label,
          action: opt.action,
          sortOrder: opt.sortOrder,
          active: true,
        },
      });
    }
  }

  list() {
    return this.prisma.botMenuOption.findMany({ orderBy: [{ sortOrder: 'asc' }, { trigger: 'asc' }] });
  }

  update(id: string, data: { label?: string; responseText?: string; active?: boolean; sortOrder?: number }) {
    return this.prisma.botMenuOption.update({ where: { id }, data });
  }

  findByTrigger(text: string) {
    const normalized = text.trim().toLowerCase();
    return this.prisma.botMenuOption.findFirst({
      where: { trigger: normalized, active: true },
    });
  }

  async buildMenuText(): Promise<string> {
    const options = await this.prisma.botMenuOption.findMany({
      where: { active: true, trigger: { in: ['1', '2', '3', '4', '5'] } },
      orderBy: { sortOrder: 'asc' },
    });
    const lines = options.map((o) => `*${o.trigger}* — ${o.label}`);
    return (
      '🍎 *Pomar Fresh*\n\n' +
      'Como posso ajudar? Responda com o número ou palavra:\n\n' +
      lines.join('\n') +
      '\n\n_menu_ — ver este menu novamente'
    );
  }
}
