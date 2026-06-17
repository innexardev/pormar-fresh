import { Prisma } from '@prisma/client';

/** Converte gramas líquidas necessárias em gramas brutas usando rendimento médio. */
export function netToGrossGrams(netGrams: number, yieldPercent: Prisma.Decimal): number {
  const yieldNum = yieldPercent.toNumber();
  if (yieldNum <= 0) return netGrams;
  return Math.ceil(netGrams / (yieldNum / 100));
}

export function kgFromGrams(grams: number): number {
  return Math.round((grams / 1000) * 1000) / 1000;
}

export const PRODUCTION_ORDER_STATUSES = [
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
] as const;

type WindowCutoff = {
  cutoffWeekday: number;
  cutoffHour: number;
  orderDeadlineDaysBefore?: number | null;
};

/** Data/hora limite para pedidos antes da entrega. */
export function computeCutoff(deliveryDate: Date, window: WindowCutoff): Date {
  const cutoff = new Date(deliveryDate);
  const daysBefore = window.orderDeadlineDaysBefore ?? 0;

  if (daysBefore > 0) {
    cutoff.setDate(cutoff.getDate() - daysBefore);
  } else {
    const deliveryDow = deliveryDate.getDay();
    let daysBack = (deliveryDow - window.cutoffWeekday + 7) % 7;
    if (daysBack === 0) daysBack = 7;
    cutoff.setDate(cutoff.getDate() - daysBack);
  }

  cutoff.setHours(window.cutoffHour, 0, 0, 0);
  return cutoff;
}

export function formatCutoffLabel(cutoff: Date): string {
  return cutoff.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type IngredientSnapshot = {
  id: string;
  name: string;
  category: string;
  avgYieldPercent: Prisma.Decimal;
  stockGrossQty: Prisma.Decimal;
  stockNetQty: Prisma.Decimal;
  purchaseUnit: string;
};

export type BomAccumulator = {
  ingredients: Map<string, { netGrams: number; ingredient: IngredientSnapshot }>;
  packaging: Map<string, { quantity: number; packaging: { id: string; name: string; sizeLabel: string } }>;
  outputs: Map<string, { key: string; itemName: string; recipeId?: string; comboId?: string; productId?: string; quantity: number }>;
  warnings: string[];
};

export function emptyBom(): BomAccumulator {
  return {
    ingredients: new Map(),
    packaging: new Map(),
    outputs: new Map(),
    warnings: [],
  };
}

export function mergeOutput(
  acc: BomAccumulator,
  key: string,
  item: { itemName: string; recipeId?: string; comboId?: string; productId?: string; quantity: number },
) {
  const existing = acc.outputs.get(key);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    acc.outputs.set(key, { key, ...item });
  }
}

export function addIngredientNeed(acc: BomAccumulator, ingredient: IngredientSnapshot, netGrams: number) {
  const existing = acc.ingredients.get(ingredient.id);
  if (existing) {
    existing.netGrams += netGrams;
  } else {
    acc.ingredients.set(ingredient.id, { netGrams, ingredient });
  }
}

export function addPackagingNeed(
  acc: BomAccumulator,
  packaging: { id: string; name: string; sizeLabel: string },
  quantity: number,
) {
  const existing = acc.packaging.get(packaging.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    acc.packaging.set(packaging.id, { quantity, packaging });
  }
}

export function bomToPlanRows(acc: BomAccumulator) {
  const ingredients = [...acc.ingredients.values()].map(({ netGrams, ingredient }) => {
    const grossGramsNeeded = netToGrossGrams(netGrams, ingredient.avgYieldPercent);
    const stockNetGrams = Math.round(ingredient.stockNetQty.toNumber() * 1000);
    const stockGrossGrams = Math.round(ingredient.stockGrossQty.toNumber() * 1000);
    const purchaseGrossGrams = Math.max(0, grossGramsNeeded - stockGrossGrams);

    return {
      ingredientId: ingredient.id,
      ingredient_name: ingredient.name,
      category: ingredient.category,
      purchase_unit: ingredient.purchaseUnit,
      net_grams_needed: netGrams,
      net_kg_needed: kgFromGrams(netGrams),
      gross_grams_needed: grossGramsNeeded,
      gross_kg_needed: kgFromGrams(grossGramsNeeded),
      stock_net_grams: stockNetGrams,
      stock_gross_grams: stockGrossGrams,
      purchase_gross_grams: purchaseGrossGrams,
      purchase_kg: kgFromGrams(purchaseGrossGrams),
      yield_percent: ingredient.avgYieldPercent,
    };
  });

  ingredients.sort((a, b) => b.purchase_gross_grams - a.purchase_gross_grams);

  const packaging = [...acc.packaging.values()].map(({ quantity, packaging: p }) => ({
    packagingId: p.id,
    name: p.name,
    size_label: p.sizeLabel,
    quantity,
  }));

  const outputs = [...acc.outputs.values()].map((o) => ({
    item_name: o.itemName,
    recipe_id: o.recipeId,
    combo_id: o.comboId,
    product_id: o.productId,
    quantity: o.quantity,
  }));

  return { ingredients, packaging, outputs, warnings: acc.warnings };
}
