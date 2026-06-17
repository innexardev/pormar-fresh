import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async deleteProduct(id: string) {
    const inOrders = await this.prisma.orderItem.count({ where: { productId: id } });
    if (inOrders > 0) {
      throw new BadRequestException(
        'Este produto possui pedidos associados e não pode ser excluído. Desative-o para ocultá-lo do cardápio.',
      );
    }
    await this.prisma.stockMovement.deleteMany({ where: { productId: id } });
    return this.prisma.product.delete({ where: { id } });
  }

  updateProduct(
    id: string,
    data: Partial<{
      categoryId: string;
      name: string;
      description: string | null;
      unitType: string;
      weightGrams: number | null;
      price: number;
      active: boolean;
      stockQty: number;
      minStock: number;
      imageUrl: string | null;
    }>,
  ) {
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

  async deleteCombo(id: string) {
    const inOrders = await this.prisma.orderItem.count({ where: { comboId: id } });
    if (inOrders > 0) {
      throw new BadRequestException(
        'Este combo possui pedidos associados e não pode ser excluído. Desative-o para ocultá-lo do cardápio.',
      );
    }
    await this.prisma.comboItem.deleteMany({ where: { comboId: id } });
    return this.prisma.combo.delete({ where: { id } });
  }

  async updateCombo(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      price: number;
      weightLabel: string | null;
      servesPeople: number | null;
      categoryId: string | null;
      active: boolean;
      featured: boolean;
      imageUrl: string | null;
      items: Array<{ itemName: string; quantity: number; unitLabel: string; productId?: string }>;
    }>,
  ) {
    const { items, ...comboData } = data;
    return this.prisma.$transaction(async (tx) => {
      if (items) {
        await tx.comboItem.deleteMany({ where: { comboId: id } });
        await tx.comboItem.createMany({
          data: items.map((i, idx) => ({
            comboId: id,
            itemName: i.itemName,
            quantity: i.quantity,
            unitLabel: i.unitLabel,
            productId: i.productId,
            sortOrder: idx,
          })),
        });
      }
      return tx.combo.update({
        where: { id },
        data: comboData,
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  listCategories() {
    return this.prisma.category.findMany({ orderBy: { position: 'asc' } });
  }

  dashboardStats() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return Promise.all([
      this.prisma.order.count({ where: { status: { not: 'cancelled' } } }),
      this.prisma.order.count({
        where: { status: { in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] } },
      }),
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.combo.count({ where: { active: true } }),
      this.prisma.order.aggregate({
        where: { status: { notIn: ['cancelled', 'pending'] }, createdAt: { gte: weekAgo } },
        _sum: { total: true },
      }),
      this.prisma.order.groupBy({
        by: ['deliveryDate'],
        where: { status: { notIn: ['cancelled'] }, deliveryDate: { gte: weekAgo } },
        _sum: { total: true },
        _count: true,
        orderBy: { deliveryDate: 'asc' },
      }),
    ]).then(([totalOrders, activeOrders, products, combos, revenueWeek, byDelivery]) => ({
      total_orders: totalOrders,
      active_orders: activeOrders,
      products,
      combos,
      revenue_week: Number(revenueWeek._sum.total ?? 0),
      orders_by_delivery: byDelivery.map((r) => ({
        date: r.deliveryDate.toISOString().slice(0, 10),
        total: Number(r._sum.total ?? 0),
        count: r._count,
      })),
    }));
  }

  listCustomers(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { phone: { contains: search } },
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        orders: {
          select: { id: true, total: true, status: true, createdAt: true, deliveryDate: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
