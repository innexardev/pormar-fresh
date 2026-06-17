import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getMenu() {
    const categories = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
    });

    const products = await this.prisma.product.findMany({
      where: { active: true, stockQty: { gt: 0 } },
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const combos = await this.prisma.combo.findMany({
      where: { active: true },
      include: { items: { orderBy: { sortOrder: 'asc' } }, category: true },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    });

    return {
      categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
      products: products.map((p) => ({
        id: p.id,
        category_id: p.categoryId,
        category_slug: p.category?.slug ?? null,
        category_name: p.category?.name ?? null,
        name: p.name,
        description: p.description,
        unit_type: p.unitType,
        weight_grams: p.weightGrams,
        price: Number(p.price),
        stock_qty: Number(p.stockQty),
        is_pre_cut: p.isPreCut,
        image_url: p.imageUrl,
      })),
      combos: combos.map((c) => ({
        id: c.id,
        category_id: c.categoryId,
        category_slug: c.category?.slug ?? null,
        category_name: c.category?.name ?? null,
        name: c.name,
        description: c.description,
        price: Number(c.price),
        weight_label: c.weightLabel,
        serves_people: c.servesPeople,
        featured: c.featured,
        image_url: c.imageUrl,
        items: c.items.map((i) => ({
          name: i.itemName,
          quantity: Number(i.quantity),
          unit: i.unitLabel,
        })),
      })),
    };
  }

  async getCombo(id: string) {
    const combo = await this.prisma.combo.findFirst({
      where: { id, active: true },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!combo) return null;
    return {
      id: combo.id,
      name: combo.name,
      description: combo.description,
      price: Number(combo.price),
      weight_label: combo.weightLabel,
      serves_people: combo.servesPeople,
      items: combo.items.map((i) => ({
        name: i.itemName,
        quantity: Number(i.quantity),
        unit: i.unitLabel,
      })),
    };
  }
}
