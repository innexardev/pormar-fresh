import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_MESSAGE_TEMPLATES, renderTemplate } from './message-templates.defaults';

@Injectable()
export class MessageTemplateService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    for (const tpl of DEFAULT_MESSAGE_TEMPLATES) {
      await this.prisma.messageTemplate.upsert({
        where: { key: tpl.key },
        create: tpl,
        update: { label: tpl.label, category: tpl.category },
      });
    }
  }

  async list(category?: string) {
    return this.prisma.messageTemplate.findMany({
      where: category ? { category } : undefined,
      orderBy: { key: 'asc' },
    });
  }

  async update(key: string, data: { body?: string; active?: boolean; label?: string }) {
    return this.prisma.messageTemplate.update({ where: { key }, data });
  }

  async render(key: string, vars: Record<string, string>): Promise<string | null> {
    const tpl = await this.prisma.messageTemplate.findUnique({ where: { key } });
    if (!tpl?.active) return null;
    return renderTemplate(tpl.body, vars);
  }

  fallback(key: string, vars: Record<string, string>): string {
    const def = DEFAULT_MESSAGE_TEMPLATES.find((t) => t.key === key);
    if (!def) return '';
    return renderTemplate(def.body, vars);
  }
}
