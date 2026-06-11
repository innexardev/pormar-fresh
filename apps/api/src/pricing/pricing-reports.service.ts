import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { calcMarginPercent, calcNetProfit, calcRecipeCost, calcSalePrice } from './pricing-calculator';

@Injectable()
export class PricingReportsService {
  constructor(private prisma: PrismaService) {}

  async fullReport(weeks = 8) {
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    const [recipes, ingredients, yieldRecords, purchases, orderItems, orders, settings] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { active: true },
        include: { items: { include: { ingredient: true } }, packaging: true, product: true, combo: true },
      }),
      this.prisma.ingredient.findMany({ where: { active: true } }),
      this.prisma.yieldRecord.findMany({
        where: { createdAt: { gte: since } },
        include: { ingredient: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ingredientPurchase.findMany({
        where: { purchaseDate: { gte: since } },
        include: { ingredient: true },
        orderBy: { purchaseDate: 'asc' },
      }),
      this.prisma.orderItem.findMany({
        where: { order: { status: { not: 'cancelled' }, createdAt: { gte: since } } },
        include: { order: true, combo: true, product: true },
      }),
      this.prisma.order.findMany({
        where: { status: { not: 'cancelled' }, createdAt: { gte: since } },
      }),
      this.prisma.pricingSettings.findUnique({ where: { id: 'default' } }),
    ]);

    const roundIncrement = settings?.roundIncrement ?? new Prisma.Decimal(0.1);

    const profitability = recipes.map((r) => {
      const costs = calcRecipeCost({
        items: r.items.map((i) => ({ quantityGrams: i.quantityGrams, costPerKgNet: i.ingredient.costPerKgNet })),
        packagingCost: r.packaging?.unitCost ?? new Prisma.Decimal(0),
        wastePercent: r.wastePercent,
        feePercent: r.feePercent,
      });
      const price = calcSalePrice(costs.totalCost, r.targetMarginPercent, roundIncrement);
      const margin = calcMarginPercent(price, costs.totalCost);
      const profit = calcNetProfit(price, costs.totalCost);
      return {
        id: r.id,
        name: r.name,
        cost: costs.totalCost,
        price,
        margin_percent: margin,
        net_profit: profit,
        linked: r.product?.name ?? r.combo?.name,
      };
    });
    profitability.sort((a, b) => b.net_profit.toNumber() - a.net_profit.toNumber());

    const avgMargin =
      profitability.length > 0
        ? profitability.reduce((s, r) => s.add(r.margin_percent), new Prisma.Decimal(0)).div(profitability.length)
        : new Prisma.Decimal(0);

    const wasteByIngredient = this.aggregateWaste(yieldRecords);
    const weeklyCosts = this.aggregateWeeklyCosts(purchases);
    const priceEvolution = this.aggregatePriceEvolution(purchases);
    const salesRanking = this.aggregateSales(orderItems);
    const revenue = orders.reduce((s, o) => s.add(o.total), new Prisma.Decimal(0));
    const orderCount = orders.length;

    return {
      period_weeks: weeks,
      summary: {
        revenue,
        order_count: orderCount,
        avg_margin_percent: avgMargin,
        avg_weekly_purchase_cost: weeklyCosts.length
          ? weeklyCosts.reduce((s, w) => s + w.total, 0) / weeklyCosts.length
          : 0,
        active_ingredients: ingredients.length,
        active_recipes: recipes.length,
      },
      profitability_ranking: profitability,
      most_profitable: profitability.slice(0, 10),
      least_profitable: [...profitability].sort((a, b) => a.net_profit.toNumber() - b.net_profit.toNumber()).slice(0, 10),
      waste_by_ingredient: wasteByIngredient,
      weekly_purchase_costs: weeklyCosts,
      price_evolution: priceEvolution,
      sales_ranking: salesRanking,
      low_stock_ingredients: ingredients
        .filter((i) => i.minStock.gt(0) && i.stockNetQty.lte(i.minStock))
        .map((i) => ({
          name: i.name,
          stock_net_kg: i.stockNetQty,
          min_stock_kg: i.minStock,
        })),
    };
  }

  private aggregateWaste(records: Array<{ ingredient: { name: string }; grossWeightGrams: number; netWeightGrams: number; yieldPercent: Prisma.Decimal; lossType: string }>) {
    const map = new Map<string, { name: string; total_gross_g: number; total_net_g: number; total_waste_g: number; records: number }>();
    for (const r of records) {
      const waste = r.grossWeightGrams - r.netWeightGrams;
      const existing = map.get(r.ingredient.name) ?? { name: r.ingredient.name, total_gross_g: 0, total_net_g: 0, total_waste_g: 0, records: 0 };
      existing.total_gross_g += r.grossWeightGrams;
      existing.total_net_g += r.netWeightGrams;
      existing.total_waste_g += waste;
      existing.records += 1;
      map.set(r.ingredient.name, existing);
    }
    return [...map.values()]
      .map((v) => ({
        ...v,
        waste_percent: v.total_gross_g > 0 ? Math.round((v.total_waste_g / v.total_gross_g) * 1000) / 10 : 0,
        waste_kg: Math.round(v.total_waste_g) / 1000,
      }))
      .sort((a, b) => b.waste_kg - a.waste_kg);
  }

  private aggregateWeeklyCosts(purchases: Array<{ purchaseDate: Date; pricePaid: Prisma.Decimal }>) {
    const map = new Map<string, number>();
    for (const p of purchases) {
      const week = this.weekKey(p.purchaseDate);
      map.set(week, (map.get(week) ?? 0) + p.pricePaid.toNumber());
    }
    return [...map.entries()]
      .map(([week, total]) => ({ week, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  private aggregatePriceEvolution(purchases: Array<{ purchaseDate: Date; costPerKgNet: Prisma.Decimal; ingredient: { name: string } }>) {
    const map = new Map<string, Array<{ date: string; cost_per_kg: number }>>();
    for (const p of purchases) {
      const list = map.get(p.ingredient.name) ?? [];
      list.push({ date: p.purchaseDate.toISOString().slice(0, 10), cost_per_kg: p.costPerKgNet.toNumber() });
      map.set(p.ingredient.name, list);
    }
    return [...map.entries()].map(([name, points]) => ({ ingredient: name, points }));
  }

  private aggregateSales(items: Array<{ itemName: string; quantity: Prisma.Decimal; lineTotal: Prisma.Decimal; comboId: string | null; productId: string | null }>) {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const i of items) {
      const existing = map.get(i.itemName) ?? { name: i.itemName, quantity: 0, revenue: 0 };
      existing.quantity += i.quantity.toNumber();
      existing.revenue += i.lineTotal.toNumber();
      map.set(i.itemName, existing);
    }
    return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 15);
  }

  private weekKey(d: Date): string {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date.toISOString().slice(0, 10);
  }
}
