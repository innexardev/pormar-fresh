import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { netToGrossGrams } from '../production/production-calculator';

export type BomLine = {
  ingredientId: string;
  netGrams: number;
  ingredient: {
    id: string;
    name: string;
    stockNetQty: Prisma.Decimal;
    stockGrossQty: Prisma.Decimal;
    avgYieldPercent: Prisma.Decimal;
  };
};

@Injectable()
export class BomService {
  constructor(private prisma: PrismaService) {}

  async loadRecipeMaps() {
    const recipes = await this.prisma.recipe.findMany({
      where: { active: true },
      include: { items: { include: { ingredient: true } } },
    });
    return {
      byCombo: new Map(recipes.filter((r) => r.comboId).map((r) => [r.comboId!, r])),
      byProduct: new Map(recipes.filter((r) => r.productId).map((r) => [r.productId!, r])),
    };
  }

  explodeOrderItems(
    items: Array<{
      comboId: string | null;
      productId: string | null;
      quantity: Prisma.Decimal;
      itemName: string;
    }>,
    maps: Awaited<ReturnType<BomService['loadRecipeMaps']>>,
  ): { lines: BomLine[]; warnings: string[] } {
    const aggregated = new Map<string, BomLine>();
    const warnings: string[] = [];

    for (const item of items) {
      const qty = item.quantity.toNumber();
      const recipe = item.comboId
        ? maps.byCombo.get(item.comboId)
        : item.productId
          ? maps.byProduct.get(item.productId)
          : undefined;

      if (!recipe) {
        warnings.push(`Sem receita para "${item.itemName}"`);
        continue;
      }

      for (const ri of recipe.items) {
        const netGrams = ri.quantityGrams * qty;
        const existing = aggregated.get(ri.ingredientId);
        if (existing) {
          existing.netGrams += netGrams;
        } else {
          aggregated.set(ri.ingredientId, {
            ingredientId: ri.ingredientId,
            netGrams,
            ingredient: ri.ingredient,
          });
        }
      }
    }

    return { lines: [...aggregated.values()], warnings };
  }

  async deductForOrder(
    orderId: string,
    items: Array<{
      comboId: string | null;
      productId: string | null;
      quantity: Prisma.Decimal;
      itemName: string;
    }>,
  ) {
    const maps = await this.loadRecipeMaps();
    const { lines } = this.explodeOrderItems(items, maps);
    if (lines.length === 0) return { deducted: [] as string[] };

    const deducted: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const netKg = new Prisma.Decimal(line.netGrams).div(1000);
        const grossGrams = netToGrossGrams(line.netGrams, line.ingredient.avgYieldPercent);
        const grossKg = new Prisma.Decimal(grossGrams).div(1000);

        const current = await tx.ingredient.findUnique({ where: { id: line.ingredientId } });
        if (!current) continue;

        const newNet = current.stockNetQty.sub(netKg);
        const newGross = current.stockGrossQty.sub(grossKg);

        await tx.ingredient.update({
          where: { id: line.ingredientId },
          data: {
            stockNetQty: newNet.lt(0) ? 0 : newNet,
            stockGrossQty: newGross.lt(0) ? 0 : newGross,
          },
        });

        await tx.ingredientStockMovement.create({
          data: {
            ingredientId: line.ingredientId,
            type: 'out_sale',
            quantity: netKg,
            reason: `Pedido ${orderId.slice(0, 8)}`,
          },
        });

        deducted.push(line.ingredient.name);
      }
    });

    return { deducted };
  }
}