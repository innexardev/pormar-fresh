import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeCutoff, formatCutoffLabel } from '../production/production-calculator';

export type DeliverySlot = {
  slot_key: string;
  id: string;
  label: string;
  delivery_date: string;
  cutoff_at: string;
  cutoff_label: string;
  available: boolean;
  unavailable_reason?: string;
};

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async getAvailableWindows(): Promise<DeliverySlot[]> {
    const windows = await this.prisma.deliveryWindow.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    const blocks = await this.prisma.deliveryBlock.findMany();
    const blockedDates = new Set(blocks.map((b) => b.blockDate.toISOString().slice(0, 10)));

    const now = new Date();
    const slots: DeliverySlot[] = [];

    for (let weekOffset = 0; weekOffset < 3; weekOffset++) {
      for (const w of windows) {
        const deliveryDate = this.nextDateForWeekday(w.weekday, weekOffset);
        const dateStr = deliveryDate.toISOString().slice(0, 10);
        const slotKey = `${w.id}:${dateStr}`;

        if (slots.some((s) => s.slot_key === slotKey)) continue;

        const cutoff = computeCutoff(deliveryDate, {
          cutoffWeekday: w.cutoffWeekday,
          cutoffHour: w.cutoffHour,
          orderDeadlineDaysBefore: w.orderDeadlineDaysBefore,
        });

        const blocked = blockedDates.has(dateStr);
        const cutoffPassed = cutoff <= now;
        const available = !blocked && !cutoffPassed;

        let unavailableReason: string | undefined;
        if (blocked) unavailableReason = 'Data indisponível';
        else if (cutoffPassed) unavailableReason = `Prazo encerrado em ${formatCutoffLabel(cutoff)}`;

        slots.push({
          slot_key: slotKey,
          id: w.id,
          label: `${w.label} — ${this.formatDateBR(deliveryDate)}`,
          delivery_date: dateStr,
          cutoff_at: cutoff.toISOString(),
          cutoff_label: formatCutoffLabel(cutoff),
          available,
          unavailable_reason: unavailableReason,
        });
      }
    }

    slots.sort((a, b) => a.delivery_date.localeCompare(b.delivery_date) || a.label.localeCompare(b.label));

    return slots.slice(0, 8);
  }

  listWindowsAdmin() {
    return this.prisma.deliveryWindow.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  updateWindow(
    id: string,
    data: {
      label?: string;
      cutoffHour?: number;
      orderDeadlineDaysBefore?: number;
      active?: boolean;
    },
  ) {
    return this.prisma.deliveryWindow.update({
      where: { id },
      data: {
        label: data.label,
        cutoffHour: data.cutoffHour,
        orderDeadlineDaysBefore: data.orderDeadlineDaysBefore,
        active: data.active,
      },
    });
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

  private formatDateBR(d: Date): string {
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  }
}
