import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { calcMarginPercent, calcNetProfit, calcRecipeCost, calcSalePrice } from './pricing-calculator';

@Injectable()
export class PricingAlertsService {
  constructor(private prisma: PrismaService) {}

  listAlerts(unreadOnly = true) {
    return this.prisma.pricingAlert.findMany({
      where: unreadOnly ? { read: false } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  markRead(id: string) {
    return this.prisma.pricingAlert.update({ where: { id }, data: { read: true } });
  }

  markAllRead() {
    return this.prisma.pricingAlert.updateMany({ where: { read: false }, data: { read: true } });
  }

  async scanAll() {
    const created: string[] = [];
    const settings = await this.prisma.pricingSettings.findUnique({ where: { id: 'default' } });
    const roundIncrement = settings?.roundIncrement ?? new Prisma.Decimal(0.1);

    const recipes = await this.prisma.recipe.findMany({
      where: { active: true },
      include: { items: { include: { ingredient: true } }, packaging: true },
    });

    for (const recipe of recipes) {
      const costs = calcRecipeCost({
        items: recipe.items.map((i) => ({ quantityGrams: i.quantityGrams, costPerKgNet: i.ingredient.costPerKgNet })),
        packagingCost: recipe.packaging?.unitCost ?? new Prisma.Decimal(0),
        wastePercent: recipe.wastePercent,
        feePercent: recipe.feePercent,
      });
      const price = calcSalePrice(costs.totalCost, recipe.targetMarginPercent, roundIncrement);
      const margin = calcMarginPercent(price, costs.totalCost);
      const profit = calcNetProfit(price, costs.totalCost);

      if (margin.lt(recipe.minMarginPercent)) {
        await this.createAlert('low_margin', `Margem abaixo do mínimo em "${recipe.name}" (${margin}%)`, 'recipe', recipe.id);
        created.push('low_margin');
      }
      if (profit.lte(0)) {
        await this.createAlert('no_profit', `Produto sem lucro: "${recipe.name}"`, 'recipe', recipe.id);
        created.push('no_profit');
      }
      if (margin.lt(recipe.idealMarginPercent) && margin.gte(recipe.minMarginPercent)) {
        await this.createAlert('below_ideal_margin', `Margem abaixo do ideal em "${recipe.name}" (${margin}%)`, 'recipe', recipe.id);
        created.push('below_ideal_margin');
      }
    }

    const ingredients = await this.prisma.ingredient.findMany({ where: { active: true } });
    for (const ing of ingredients) {
      if (ing.stockNetQty.lte(ing.minStock) && ing.minStock.gt(0)) {
        await this.createAlert(
          'low_stock',
          `Estoque crítico: ${ing.name} (${ing.stockNetQty} kg líquido)`,
          'ingredient',
          ing.id,
        );
        created.push('low_stock');
      }
      if (ing.avgYieldPercent.lt(50)) {
        await this.createAlert(
          'high_waste',
          `Desperdício alto em ${ing.name}: rendimento ${ing.avgYieldPercent}%`,
          'ingredient',
          ing.id,
        );
        created.push('high_waste');
      }
    }

    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + 3);

    const expiring = await this.prisma.ingredientPurchase.findMany({
      where: { expiryDate: { lte: expiryThreshold, gte: new Date() } },
      include: { ingredient: true },
      orderBy: { expiryDate: 'asc' },
    });
    for (const p of expiring) {
      await this.createAlert(
        'expiry_soon',
        `Validade próxima: ${p.ingredient.name} (${p.expiryDate?.toISOString().slice(0, 10)})`,
        'ingredient',
        p.ingredientId,
      );
      created.push('expiry_soon');
    }

    for (const ing of ingredients) {
      const purchases = await this.prisma.ingredientPurchase.findMany({
        where: { ingredientId: ing.id },
        orderBy: { purchaseDate: 'desc' },
        take: 2,
      });
      if (purchases.length >= 2) {
        const latest = purchases[0].costPerKgNet.toNumber();
        const previous = purchases[1].costPerKgNet.toNumber();
        if (previous > 0 && (latest - previous) / previous > 0.2) {
          await this.createAlert(
            'high_cost',
            `Custo subiu >20%: ${ing.name} (R$ ${previous.toFixed(2)} → R$ ${latest.toFixed(2)}/kg)`,
            'ingredient',
            ing.id,
          );
          created.push('high_cost');
        }
      }
    }

    return { scanned: true, alerts_created: created.length, types: [...new Set(created)] };
  }

  private async createAlert(type: string, message: string, entityType: string, entityId: string) {
    const existing = await this.prisma.pricingAlert.findFirst({
      where: { type, entityType, entityId, read: false },
    });
    if (existing) return;
    await this.prisma.pricingAlert.create({ data: { type, message, entityType, entityId } });
  }
}
