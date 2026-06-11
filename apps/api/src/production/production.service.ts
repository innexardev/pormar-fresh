import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  addIngredientNeed,
  addPackagingNeed,
  bomToPlanRows,
  computeCutoff,
  emptyBom,
  mergeOutput,
  PRODUCTION_ORDER_STATUSES,
} from './production-calculator';

@Injectable()
export class ProductionService {
  constructor(private prisma: PrismaService) {}

  async listPlans(limit = 20) {
    const plans = await this.prisma.productionPlan.findMany({
      include: { deliveryWindow: true },
      orderBy: [{ deliveryDate: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return plans.map((p) => ({
      id: p.id,
      delivery_date: p.deliveryDate.toISOString().slice(0, 10),
      delivery_label: p.deliveryWindow.label,
      status: p.status,
      orders_count: p.ordersCount,
      created_at: p.createdAt.toISOString(),
    }));
  }

  async getPlan(id: string) {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id },
      include: {
        deliveryWindow: true,
        outputs: { orderBy: { itemName: 'asc' } },
        ingredients: {
          include: { ingredient: true },
          orderBy: { purchaseGrossGrams: 'desc' },
        },
        packaging: { include: { packaging: true } },
      },
    });
    if (!plan) throw new NotFoundException('Plano nao encontrado');

    return {
      id: plan.id,
      delivery_date: plan.deliveryDate.toISOString().slice(0, 10),
      delivery_label: plan.deliveryWindow.label,
      status: plan.status,
      orders_count: plan.ordersCount,
      cutoff_at: plan.cutoffAt?.toISOString(),
      warnings: (plan.warningsJson as string[] | null) ?? [],
      notes: plan.notes,
      outputs: plan.outputs.map((o) => ({
        item_name: o.itemName,
        quantity: Number(o.quantity),
        recipe_id: o.recipeId,
        combo_id: o.comboId,
        product_id: o.productId,
      })),
      shopping_list: plan.ingredients.map((i) => ({
        ingredient_id: i.ingredientId,
        name: i.ingredient.name,
        category: i.ingredient.category,
        purchase_unit: i.ingredient.purchaseUnit,
        net_kg_needed: Math.round(i.netGramsNeeded) / 1000,
        gross_kg_needed: Math.round(i.grossGramsNeeded) / 1000,
        stock_net_kg: Math.round(i.stockNetGrams) / 1000,
        purchase_kg: Math.round(i.purchaseGrossGrams) / 1000,
        yield_percent: i.ingredient.avgYieldPercent,
      })),
      packaging: plan.packaging.map((p) => ({
        name: p.packaging.name,
        size_label: p.packaging.sizeLabel,
        quantity: p.quantity,
      })),
    };
  }

  async upcomingSlots() {
    const windows = await this.prisma.deliveryWindow.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    const now = new Date();
    const slots: Array<{
      delivery_window_id: string;
      delivery_label: string;
      delivery_date: string;
      cutoff_at: string;
      cutoff_passed: boolean;
      orders_count: number;
      plan_id: string | null;
      plan_status: string | null;
    }> = [];

    for (let weekOffset = 0; weekOffset < 3; weekOffset++) {
      for (const w of windows) {
        const deliveryDate = this.nextDateForWeekday(w.weekday, weekOffset);
        const cutoff = computeCutoff(deliveryDate, w.cutoffWeekday, w.cutoffHour);
        const dateStr = deliveryDate.toISOString().slice(0, 10);

        const ordersCount = await this.prisma.order.count({
          where: {
            deliveryWindowId: w.id,
            deliveryDate: new Date(dateStr),
            status: { in: [...PRODUCTION_ORDER_STATUSES] },
          },
        });

        const plan = await this.prisma.productionPlan.findUnique({
          where: {
            deliveryWindowId_deliveryDate: {
              deliveryWindowId: w.id,
              deliveryDate: new Date(dateStr),
            },
          },
        });

        slots.push({
          delivery_window_id: w.id,
          delivery_label: w.label,
          delivery_date: dateStr,
          cutoff_at: cutoff.toISOString(),
          cutoff_passed: cutoff <= now,
          orders_count: ordersCount,
          plan_id: plan?.id ?? null,
          plan_status: plan?.status ?? null,
        });
      }
    }

    return slots
      .filter((s) => new Date(s.delivery_date) >= this.startOfToday())
      .sort((a, b) => a.delivery_date.localeCompare(b.delivery_date))
      .slice(0, 6);
  }

  async generatePlan(deliveryWindowId: string, deliveryDate: string) {
    const window = await this.prisma.deliveryWindow.findUnique({ where: { id: deliveryWindowId } });
    if (!window?.active) throw new BadRequestException('Janela de entrega invalida');

    const date = new Date(deliveryDate);
    const cutoff = computeCutoff(date, window.cutoffWeekday, window.cutoffHour);

    const orders = await this.prisma.order.findMany({
      where: {
        deliveryWindowId,
        deliveryDate: date,
        status: { in: [...PRODUCTION_ORDER_STATUSES] },
      },
      include: { items: true },
    });

    const recipes = await this.prisma.recipe.findMany({
      where: { active: true },
      include: {
        items: { include: { ingredient: true } },
        packaging: true,
      },
    });

    const recipeByCombo = new Map(recipes.filter((r) => r.comboId).map((r) => [r.comboId!, r]));
    const recipeByProduct = new Map(recipes.filter((r) => r.productId).map((r) => [r.productId!, r]));

    const acc = emptyBom();

    for (const order of orders) {
      for (const item of order.items) {
        const qty = item.quantity.toNumber();
        const recipe = item.comboId
          ? recipeByCombo.get(item.comboId)
          : item.productId
            ? recipeByProduct.get(item.productId)
            : undefined;

        if (!recipe) {
          acc.warnings.push(`Sem receita para "${item.itemName}" (pedido ${order.id.slice(0, 8)})`);
          mergeOutput(acc, `raw:${item.id}`, {
            itemName: item.itemName,
            comboId: item.comboId ?? undefined,
            productId: item.productId ?? undefined,
            quantity: qty,
          });
          continue;
        }

        mergeOutput(acc, `recipe:${recipe.id}`, {
          itemName: recipe.name,
          recipeId: recipe.id,
          comboId: item.comboId ?? undefined,
          productId: item.productId ?? undefined,
          quantity: qty,
        });

        for (const ri of recipe.items) {
          addIngredientNeed(acc, ri.ingredient, ri.quantityGrams * qty);
        }

        if (recipe.packaging) {
          addPackagingNeed(acc, recipe.packaging, qty);
        }
      }
    }

    const bom = bomToPlanRows(acc);

    const plan = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.productionPlan.findUnique({
        where: {
          deliveryWindowId_deliveryDate: { deliveryWindowId, deliveryDate: date },
        },
      });

      if (existing) {
        await tx.productionPlanOutput.deleteMany({ where: { planId: existing.id } });
        await tx.productionPlanIngredient.deleteMany({ where: { planId: existing.id } });
        await tx.productionPlanPackaging.deleteMany({ where: { planId: existing.id } });
      }

      const saved = await tx.productionPlan.upsert({
        where: {
          deliveryWindowId_deliveryDate: { deliveryWindowId, deliveryDate: date },
        },
        create: {
          deliveryWindowId,
          deliveryDate: date,
          status: 'draft',
          ordersCount: orders.length,
          cutoffAt: cutoff,
          warningsJson: bom.warnings,
          outputs: {
            create: bom.outputs.map((o) => ({
              itemName: o.item_name,
              recipeId: o.recipe_id,
              comboId: o.combo_id,
              productId: o.product_id,
              quantity: o.quantity,
            })),
          },
          ingredients: {
            create: bom.ingredients.map((i) => ({
              ingredientId: i.ingredientId,
              netGramsNeeded: i.net_grams_needed,
              grossGramsNeeded: i.gross_grams_needed,
              stockNetGrams: i.stock_net_grams,
              purchaseGrossGrams: i.purchase_gross_grams,
            })),
          },
          packaging: {
            create: bom.packaging.map((p) => ({
              packagingId: p.packagingId,
              quantity: p.quantity,
            })),
          },
        },
        update: {
          ordersCount: orders.length,
          cutoffAt: cutoff,
          warningsJson: bom.warnings,
          outputs: {
            create: bom.outputs.map((o) => ({
              itemName: o.item_name,
              recipeId: o.recipe_id,
              comboId: o.combo_id,
              productId: o.product_id,
              quantity: o.quantity,
            })),
          },
          ingredients: {
            create: bom.ingredients.map((i) => ({
              ingredientId: i.ingredientId,
              netGramsNeeded: i.net_grams_needed,
              grossGramsNeeded: i.gross_grams_needed,
              stockNetGrams: i.stock_net_grams,
              purchaseGrossGrams: i.purchase_gross_grams,
            })),
          },
          packaging: {
            create: bom.packaging.map((p) => ({
              packagingId: p.packagingId,
              quantity: p.quantity,
            })),
          },
        },
      });

      return saved;
    });

    return this.getPlan(plan.id);
  }

  async finalizePlan(id: string) {
    const plan = await this.prisma.productionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plano nao encontrado');
    await this.prisma.productionPlan.update({
      where: { id },
      data: { status: 'finalized' },
    });
    return { id, status: 'finalized' };
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

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
