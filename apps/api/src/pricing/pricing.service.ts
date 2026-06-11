import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  calcCostPerKgNet,
  calcMarginPercent,
  calcNetProfit,
  calcRecipeCost,
  calcSalePrice,
  calcYieldPercent,
  suggestMargins,
} from './pricing-calculator';
import { PricingAlertsService } from './pricing-alerts.service';

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private alertsService: PricingAlertsService,
  ) {}
  private async getSettings() {
    let settings = await this.prisma.pricingSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await this.prisma.pricingSettings.create({ data: { id: 'default' } });
    }
    return settings;
  }

  async dashboard() {
    const [ingredients, recipes, alerts, settings] = await Promise.all([
      this.prisma.ingredient.count({ where: { active: true } }),
      this.prisma.recipe.findMany({
        where: { active: true },
        include: { items: { include: { ingredient: true } }, packaging: true, product: true, combo: true },
      }),
      this.prisma.pricingAlert.findMany({ where: { read: false }, orderBy: { createdAt: 'desc' }, take: 10 }),
      this.getSettings(),
    ]);

    let totalCost = new Prisma.Decimal(0);
    let totalSuggested = new Prisma.Decimal(0);
    const recipeSummaries = recipes.map((r) => {
      const calc = this.computeRecipeFromParts(
        r.items.map((i) => ({ quantityGrams: i.quantityGrams, costPerKgNet: i.ingredient.costPerKgNet })),
        r.packaging?.unitCost ?? new Prisma.Decimal(0),
        r.wastePercent,
        r.feePercent,
        r.targetMarginPercent,
        settings.roundIncrement,
      );
      totalCost = totalCost.add(calc.totalCost);
      totalSuggested = totalSuggested.add(calc.suggestedPrice);
      const margin = calcMarginPercent(calc.suggestedPrice, calc.totalCost);
      return {
        id: r.id,
        name: r.name,
        total_cost: calc.totalCost,
        suggested_price: calc.suggestedPrice,
        margin_percent: margin,
        net_profit: calcNetProfit(calc.suggestedPrice, calc.totalCost),
        linked_product: r.product?.name,
        linked_combo: r.combo?.name,
      };
    });

    recipeSummaries.sort((a, b) => b.net_profit.toNumber() - a.net_profit.toNumber());

    const avgMargin =
      recipeSummaries.length > 0
        ? recipeSummaries.reduce((s, r) => s.add(r.margin_percent), new Prisma.Decimal(0)).div(recipeSummaries.length)
        : new Prisma.Decimal(0);

    return {
      ingredients_count: ingredients,
      recipes_count: recipes.length,
      avg_margin_percent: avgMargin,
      total_recipe_cost: totalCost,
      total_suggested_revenue: totalSuggested,
      top_profitable: recipeSummaries.slice(0, 5),
      least_profitable: [...recipeSummaries].sort((a, b) => a.net_profit.toNumber() - b.net_profit.toNumber()).slice(0, 5),
      alerts,
      settings,
    };
  }

  getSettingsPublic() {
    return this.getSettings();
  }

  updateSettings(data: Partial<{
    defaultTargetMargin: number;
    defaultMinMargin: number;
    defaultIdealMargin: number;
    roundIncrement: number;
    autoUpdatePrices: boolean;
    perishableMarkupBoost: number;
    yieldHistorySize: number;
  }>) {
    return this.prisma.pricingSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });
  }

  // --- Ingredients ---
  listIngredients() {
    return this.prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
  }

  createIngredient(data: {
    name: string;
    category: string;
    purchaseUnit: string;
    minStock?: number;
    perishable?: boolean;
    notes?: string;
  }) {
    return this.prisma.ingredient.create({
      data: {
        name: data.name,
        category: data.category,
        purchaseUnit: data.purchaseUnit,
        minStock: data.minStock ?? 0,
        perishable: data.perishable ?? true,
        notes: data.notes,
      },
    });
  }

  updateIngredient(id: string, data: Partial<{ name: string; active: boolean; minStock: number; notes: string }>) {
    return this.prisma.ingredient.update({ where: { id }, data });
  }

  async registerPurchase(
    ingredientId: string,
    data: {
      supplier?: string;
      purchaseDate: string;
      pricePaid: number;
      grossWeightGrams: number;
      netWeightGrams: number;
      expiryDate?: string;
      notes?: string;
    },
  ) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id: ingredientId } });
    if (!ingredient) throw new NotFoundException('Ingrediente nao encontrado');

    const pricePaid = new Prisma.Decimal(data.pricePaid);
    const yieldPercent = calcYieldPercent(data.grossWeightGrams, data.netWeightGrams);
    const costPerKgNet = calcCostPerKgNet(pricePaid, data.netWeightGrams);

    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.ingredientPurchase.create({
        data: {
          ingredientId,
          supplier: data.supplier,
          purchaseDate: new Date(data.purchaseDate),
          pricePaid,
          grossWeightGrams: data.grossWeightGrams,
          netWeightGrams: data.netWeightGrams,
          yieldPercent,
          costPerKgNet,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
          notes: data.notes,
        },
      });

      await tx.yieldRecord.create({
        data: {
          ingredientId,
          lossType: 'limpeza',
          grossWeightGrams: data.grossWeightGrams,
          netWeightGrams: data.netWeightGrams,
          yieldPercent,
          notes: 'Compra registrada',
        },
      });

      const avgYield = await this.computeAvgYield(tx, ingredientId);
      const grossKg = new Prisma.Decimal(data.grossWeightGrams).div(1000);
      const netKg = new Prisma.Decimal(data.netWeightGrams).div(1000);

      await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          costPerKgNet,
          avgYieldPercent: avgYield,
          stockGrossQty: ingredient.stockGrossQty.add(grossKg),
          stockNetQty: ingredient.stockNetQty.add(netKg),
        },
      });

      await tx.ingredientStockMovement.create({
        data: {
          ingredientId,
          type: 'in_gross',
          quantity: grossKg,
          reason: `Compra ${purchase.id.slice(0, 8)}`,
        },
      });

      if (await this.shouldAutoUpdatePrices()) {
        await this.recalculateAllRecipes(tx);
      }

      await this.alertsService.scanAll();

      return purchase;
    });
  }

  async registerYield(
    ingredientId: string,
    data: {
      lossType: string;
      grossWeightGrams: number;
      netWeightGrams: number;
      notes?: string;
    },
  ) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id: ingredientId } });
    if (!ingredient) throw new NotFoundException('Ingrediente nao encontrado');

    const yieldPercent = calcYieldPercent(data.grossWeightGrams, data.netWeightGrams);

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.yieldRecord.create({
        data: { ingredientId, ...data, yieldPercent },
      });

      const avgYield = await this.computeAvgYield(tx, ingredientId);
      const netDelta = new Prisma.Decimal(data.netWeightGrams).div(1000);
      const grossDelta = new Prisma.Decimal(data.grossWeightGrams).div(1000);

      await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          avgYieldPercent: avgYield,
          stockGrossQty: ingredient.stockGrossQty.sub(grossDelta),
          stockNetQty: ingredient.stockNetQty.add(netDelta),
        },
      });

      await tx.ingredientStockMovement.create({
        data: { ingredientId, type: 'process_net', quantity: netDelta, reason: data.lossType },
      });

      return record;
    });
  }

  listPurchases(ingredientId: string) {
    return this.prisma.ingredientPurchase.findMany({
      where: { ingredientId },
      orderBy: { purchaseDate: 'desc' },
      take: 30,
    });
  }

  listIngredientMovements(ingredientId: string) {
    return this.prisma.ingredientStockMovement.findMany({
      where: { ingredientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // --- Packaging ---
  listPackaging() {
    return this.prisma.packaging.findMany({ orderBy: { name: 'asc' } });
  }

  createPackaging(data: {
    name: string;
    type: string;
    sizeLabel: string;
    unitCost: number;
    capacityGrams?: number;
    capacityMl?: number;
  }) {
    return this.prisma.packaging.create({ data });
  }

  updatePackaging(id: string, data: Partial<{ name: string; unitCost: number; active: boolean }>) {
    return this.prisma.packaging.update({ where: { id }, data });
  }

  // --- Recipes ---
  listRecipes() {
    return this.prisma.recipe.findMany({
      include: {
        items: { include: { ingredient: true }, orderBy: { sortOrder: 'asc' } },
        packaging: true,
        product: true,
        combo: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createRecipe(data: {
    name: string;
    productId?: string;
    comboId?: string;
    packagingId?: string;
    targetMarginPercent?: number;
    minMarginPercent?: number;
    idealMarginPercent?: number;
    wastePercent?: number;
    feePercent?: number;
    items: Array<{ ingredientId: string; quantityGrams: number }>;
  }) {
    const settings = await this.getSettings();
    const recipe = await this.prisma.recipe.create({
      data: {
        name: data.name,
        productId: data.productId,
        comboId: data.comboId,
        packagingId: data.packagingId,
        targetMarginPercent: data.targetMarginPercent ?? settings.defaultTargetMargin,
        minMarginPercent: data.minMarginPercent ?? settings.defaultMinMargin,
        idealMarginPercent: data.idealMarginPercent ?? settings.defaultIdealMargin,
        wastePercent: data.wastePercent ?? 0,
        feePercent: data.feePercent ?? 0,
        items: {
          create: data.items.map((i, idx) => ({
            ingredientId: i.ingredientId,
            quantityGrams: i.quantityGrams,
            sortOrder: idx,
          })),
        },
      },
      include: {
        items: { include: { ingredient: true } },
        packaging: true,
      },
    });

    return this.refreshRecipeCosts(recipe.id);
  }

  async updateRecipe(
    id: string,
    data: Partial<{
      name: string;
      packagingId: string;
      targetMarginPercent: number;
      wastePercent: number;
      feePercent: number;
      active: boolean;
      items: Array<{ ingredientId: string; quantityGrams: number }>;
    }>,
  ) {
    const { items, ...rest } = data;
    await this.prisma.recipe.update({ where: { id }, data: rest });

    if (items) {
      await this.prisma.recipeItem.deleteMany({ where: { recipeId: id } });
      await this.prisma.recipeItem.createMany({
        data: items.map((i, idx) => ({
          recipeId: id,
          ingredientId: i.ingredientId,
          quantityGrams: i.quantityGrams,
          sortOrder: idx,
        })),
      });
    }

    return this.refreshRecipeCosts(id);
  }

  async simulateRecipe(
    id: string,
    overrides?: {
      items?: Array<{ ingredientId: string; quantityGrams: number }>;
      packagingId?: string;
      targetMarginPercent?: number;
      wastePercent?: number;
      feePercent?: number;
    },
  ) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: { items: { include: { ingredient: true } }, packaging: true },
    });
    if (!recipe) throw new NotFoundException('Receita nao encontrada');

    const settings = await this.getSettings();
    let items = recipe.items;
    if (overrides?.items) {
      const ingredientIds = overrides.items.map((i) => i.ingredientId);
      const ingredients = await this.prisma.ingredient.findMany({ where: { id: { in: ingredientIds } } });
      const map = new Map(ingredients.map((i) => [i.id, i]));
      items = overrides.items.map((i, idx) => ({
        id: `sim-${idx}`,
        recipeId: id,
        ingredientId: i.ingredientId,
        quantityGrams: i.quantityGrams,
        sortOrder: idx,
        ingredient: map.get(i.ingredientId)!,
      }));
    }

    let packaging = recipe.packaging;
    if (overrides?.packagingId) {
      packaging = await this.prisma.packaging.findUnique({ where: { id: overrides.packagingId } });
    }

    const margin = new Prisma.Decimal(overrides?.targetMarginPercent ?? recipe.targetMarginPercent.toNumber());
    const waste = new Prisma.Decimal(overrides?.wastePercent ?? recipe.wastePercent.toNumber());
    const fee = new Prisma.Decimal(overrides?.feePercent ?? recipe.feePercent.toNumber());

    const calc = this.computeRecipeFromParts(
      items.map((i) => ({ quantityGrams: i.quantityGrams, costPerKgNet: i.ingredient.costPerKgNet })),
      packaging?.unitCost ?? new Prisma.Decimal(0),
      waste,
      fee,
      margin,
      settings.roundIncrement,
    );

    const anyPerishable = items.some((i) => i.ingredient?.perishable);
    const marginSuggestions = suggestMargins(anyPerishable, settings);

    return {
      ...calc,
      margin_suggestions: {
        safe_price: calcSalePrice(calc.totalCost, marginSuggestions.safe, settings.roundIncrement),
        ideal_price: calcSalePrice(calc.totalCost, marginSuggestions.ideal, settings.roundIncrement),
        premium_price: calcSalePrice(calc.totalCost, marginSuggestions.premium, settings.roundIncrement),
      },
      breakdown: items.map((i) => ({
        ingredient: i.ingredient.name,
        quantity_grams: i.quantityGrams,
        cost_per_kg: i.ingredient.costPerKgNet,
        line_cost: new Prisma.Decimal(i.quantityGrams).div(1000).mul(i.ingredient.costPerKgNet).toDecimalPlaces(2),
      })),
    };
  }

  async applyRecipePrice(id: string) {
    const recipe = await this.refreshRecipeCosts(id);
    if (recipe.productId) {
      await this.prisma.product.update({
        where: { id: recipe.productId },
        data: { price: recipe.suggestedPrice },
      });
    }
    if (recipe.comboId) {
      await this.prisma.combo.update({
        where: { id: recipe.comboId },
        data: { price: recipe.suggestedPrice },
      });
    }
    return recipe;
  }

  // --- Internal helpers ---
  private computeRecipeFromEntity(recipe: {
    items: Array<{ quantityGrams: number; ingredient: { costPerKgNet: Prisma.Decimal } }>;
    packaging: { unitCost: Prisma.Decimal } | null;
    wastePercent: Prisma.Decimal;
    feePercent: Prisma.Decimal;
    targetMarginPercent: Prisma.Decimal;
  }) {
    const settings = { roundIncrement: new Prisma.Decimal(0.1) };
    return this.computeRecipeFromParts(
      recipe.items.map((i) => ({ quantityGrams: i.quantityGrams, costPerKgNet: i.ingredient.costPerKgNet })),
      recipe.packaging?.unitCost ?? new Prisma.Decimal(0),
      recipe.wastePercent,
      recipe.feePercent,
      recipe.targetMarginPercent,
      settings.roundIncrement,
    );
  }

  private computeRecipeFromParts(
    items: Array<{ quantityGrams: number; costPerKgNet: Prisma.Decimal }>,
    packagingCost: Prisma.Decimal,
    wastePercent: Prisma.Decimal,
    feePercent: Prisma.Decimal,
    marginPercent: Prisma.Decimal,
    roundIncrement: Prisma.Decimal,
  ) {
    const costs = calcRecipeCost({
      items,
      packagingCost,
      wastePercent,
      feePercent,
    });
    const suggestedPrice = calcSalePrice(costs.totalCost, marginPercent, roundIncrement);
    return {
      ...costs,
      suggestedPrice,
      marginPercent: calcMarginPercent(suggestedPrice, costs.totalCost),
      netProfit: calcNetProfit(suggestedPrice, costs.totalCost),
    };
  }

  private async refreshRecipeCosts(id: string) {
    const settings = await this.getSettings();
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: { items: { include: { ingredient: true } }, packaging: true },
    });
    if (!recipe) throw new NotFoundException('Receita nao encontrada');

    const calc = this.computeRecipeFromParts(
      recipe.items.map((i) => ({ quantityGrams: i.quantityGrams, costPerKgNet: i.ingredient.costPerKgNet })),
      recipe.packaging?.unitCost ?? new Prisma.Decimal(0),
      recipe.wastePercent,
      recipe.feePercent,
      recipe.targetMarginPercent,
      settings.roundIncrement,
    );

    const updated = await this.prisma.recipe.update({
      where: { id },
      data: { computedCost: calc.totalCost, suggestedPrice: calc.suggestedPrice },
      include: {
        items: { include: { ingredient: true }, orderBy: { sortOrder: 'asc' } },
        packaging: true,
        product: true,
        combo: true,
      },
    });

    if (calc.marginPercent.lt(recipe.minMarginPercent)) {
      await this.prisma.pricingAlert.create({
        data: {
          type: 'low_margin',
          message: `Margem abaixo do minimo em "${recipe.name}" (${calc.marginPercent}%)`,
          entityType: 'recipe',
          entityId: id,
        },
      });
    }

    void this.alertsService.scanAll();

    return updated;
  }

  private async computeAvgYield(tx: Prisma.TransactionClient, ingredientId: string) {
    const settings = await this.getSettings();
    const records = await tx.yieldRecord.findMany({
      where: { ingredientId },
      orderBy: { createdAt: 'desc' },
      take: settings.yieldHistorySize,
    });
    if (records.length === 0) return new Prisma.Decimal(100);
    const sum = records.reduce((s, r) => s.add(r.yieldPercent), new Prisma.Decimal(0));
    return sum.div(records.length).toDecimalPlaces(2);
  }

  private async shouldAutoUpdatePrices() {
    const settings = await this.getSettings();
    return settings.autoUpdatePrices;
  }

  private async recalculateAllRecipes(tx: Prisma.TransactionClient) {
    const recipes = await tx.recipe.findMany({ where: { active: true }, select: { id: true } });
    for (const r of recipes) {
      await this.refreshRecipeCosts(r.id);
    }
  }
}
