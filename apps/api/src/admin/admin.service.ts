import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // --- Produtos ---
  listProducts() {
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  createProduct(data: {
    categoryId: string;
    name: string;
    description?: string;
    unitType: string;
    weightGrams?: number;
    price: number;
    stockQty?: number;
    minStock?: number;
  }) {
    return this.prisma.product.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        unitType: data.unitType,
        weightGrams: data.weightGrams,
        price: data.price,
        stockQty: data.stockQty ?? 0,
        minStock: data.minStock ?? 0,
      },
    });
  }

  updateProduct(id: string, data: Partial<{ name: string; price: number; active: boolean; stockQty: number; minStock: number; imageUrl: string | null }>) {
    return this.prisma.product.update({ where: { id }, data });
  }

  adjustStock(productId: string, quantity: number, type: 'in' | 'adjustment', reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundException('Produto nao encontrado');
      const delta = new Prisma.Decimal(quantity);
      const newQty = type === 'in' ? product.stockQty.add(delta) : delta;
      await tx.product.update({ where: { id: productId }, data: { stockQty: newQty } });
      await tx.stockMovement.create({
        data: { productId, type, quantity: delta.abs(), reason: reason ?? type },
      });
      return tx.product.findUnique({ where: { id: productId } });
    });
  }

  listStockMovements(productId?: string) {
    return this.prisma.stockMovement.findMany({
      where: productId ? { productId } : undefined,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  listLowStock() {
    return this.prisma.$queryRaw`
      SELECT id, name, stock_qty, min_stock, unit_type
      FROM products
      WHERE active = true AND stock_qty <= min_stock
      ORDER BY stock_qty ASC
    `;
  }

  // --- Combos ---
  listCombos() {
    return this.prisma.combo.findMany({
      include: { items: { orderBy: { sortOrder: 'asc' } }, category: true },
      orderBy: { name: 'asc' },
    });
  }

  createCombo(data: {
    name: string;
    description?: string;
    price: number;
    weightLabel?: string;
    servesPeople?: number;
    categoryId?: string;
    items: Array<{ itemName: string; quantity: number; unitLabel: string; productId?: string }>;
  }) {
    return this.prisma.combo.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        weightLabel: data.weightLabel,
        servesPeople: data.servesPeople,
        categoryId: data.categoryId,
        items: {
          create: data.items.map((i, idx) => ({
            itemName: i.itemName,
            quantity: i.quantity,
            unitLabel: i.unitLabel,
            productId: i.productId,
            sortOrder: idx,
          })),
        },
      },
      include: { items: true },
    });
  }

  updateCombo(id: string, data: Partial<{ name: string; price: number; active: boolean; featured: boolean; imageUrl: string | null }>) {
    return this.prisma.combo.update({ where: { id }, data });
  }

  listCategories() {
    return this.prisma.category.findMany({ orderBy: { position: 'asc' } });
  }

  dashboardStats() {
    return Promise.all([
      this.prisma.order.count({ where: { status: { not: 'cancelled' } } }),
      this.prisma.order.count({
        where: { status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] } },
      }),
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.combo.count({ where: { active: true } }),
    ]).then(([totalOrders, activeOrders, products, combos]) => ({
      total_orders: totalOrders,
      active_orders: activeOrders,
      products,
      combos,
    }));
  }
}
