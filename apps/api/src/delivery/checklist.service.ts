import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChecklistService {
  constructor(private prisma: PrismaService) {}

  async ensureForOrder(orderId: string) {
    const existing = await this.prisma.orderChecklistItem.count({ where: { orderId } });
    if (existing > 0) return this.getForOrder(orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pedido nao encontrado');

    await this.prisma.orderChecklistItem.createMany({
      data: order.items.map((item, index) => ({
        orderId,
        itemIndex: index,
        itemName: item.itemName,
        quantity: item.quantity,
        unitLabel: item.unitLabel,
        checked: false,
      })),
    });

    return this.getForOrder(orderId);
  }

  async getForOrder(orderId: string) {
    const items = await this.prisma.orderChecklistItem.findMany({
      where: { orderId },
      orderBy: { itemIndex: 'asc' },
    });
    return {
      order_id: orderId,
      all_checked: items.length > 0 && items.every((i) => i.checked),
      items: items.map((i) => ({
        item_index: i.itemIndex,
        name: i.itemName,
        quantity: Number(i.quantity),
        unit: i.unitLabel,
        checked: i.checked,
        checked_at: i.checkedAt?.toISOString() ?? null,
      })),
    };
  }

  async toggle(orderId: string, itemIndex: number, checked: boolean) {
    await this.ensureForOrder(orderId);
    const item = await this.prisma.orderChecklistItem.findFirst({
      where: { orderId, itemIndex },
    });
    if (!item) throw new NotFoundException('Item nao encontrado');

    await this.prisma.orderChecklistItem.update({
      where: { id: item.id },
      data: { checked, checkedAt: checked ? new Date() : null },
    });

    return this.getForOrder(orderId);
  }
}
