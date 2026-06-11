import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AvailableWindow = {
  id: string;
  label: string;
  delivery_date: string;
  cutoff_at: string;
};

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async getAvailableWindows(): Promise<AvailableWindow[]> {
    const windows = await this.prisma.deliveryWindow.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    const now = new Date();
    const results: AvailableWindow[] = [];

    for (let weekOffset = 0; weekOffset < 3 && results.length < 4; weekOffset++) {
      for (const w of windows) {
        const deliveryDate = this.nextDateForWeekday(w.weekday, weekOffset);
        const cutoff = this.computeCutoff(deliveryDate, w.cutoffWeekday, w.cutoffHour);
        if (cutoff > now) {
          results.push({
            id: w.id,
            label: `${w.label} — ${this.formatDateBR(deliveryDate)}`,
            delivery_date: deliveryDate.toISOString().slice(0, 10),
            cutoff_at: cutoff.toISOString(),
          });
        }
      }
    }

    return results.slice(0, 4);
  }

  private nextDateForWeekday(weekday: number, weekOffset: number): Date {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    const current = d.getDay();
    let diff = weekday - current;
    if (diff <= 0) diff += 7;
    diff += weekOffset * 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  private computeCutoff(deliveryDate: Date, cutoffWeekday: number, cutoffHour: number): Date {
    const cutoff = new Date(deliveryDate);
    const deliveryDow = deliveryDate.getDay();
    let daysBack = (deliveryDow - cutoffWeekday + 7) % 7;
    if (daysBack === 0) daysBack = 7;
    cutoff.setDate(cutoff.getDate() - daysBack);
    cutoff.setHours(cutoffHour, 0, 0, 0);
    return cutoff;
  }

  private formatDateBR(d: Date): string {
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  }
}
