import { Prisma } from '@prisma/client';

export function calcYieldPercent(grossGrams: number, netGrams: number): Prisma.Decimal {
  if (grossGrams <= 0) return new Prisma.Decimal(0);
  return new Prisma.Decimal(netGrams).div(grossGrams).mul(100).toDecimalPlaces(2);
}

export function calcCostPerKgNet(pricePaid: Prisma.Decimal, netWeightGrams: number): Prisma.Decimal {
  if (netWeightGrams <= 0) return new Prisma.Decimal(0);
  const kg = new Prisma.Decimal(netWeightGrams).div(1000);
  return pricePaid.div(kg).toDecimalPlaces(4);
}

export function roundPrice(value: Prisma.Decimal, increment: Prisma.Decimal): Prisma.Decimal {
  const inc = increment.toNumber();
  if (inc <= 0) return value.toDecimalPlaces(2);
  const rounded = Math.ceil(value.toNumber() / inc) * inc;
  return new Prisma.Decimal(rounded).toDecimalPlaces(2);
}

export function calcMarkupFactor(marginPercent: Prisma.Decimal): Prisma.Decimal {
  return new Prisma.Decimal(1).add(marginPercent.div(100));
}

export type RecipeCostInput = {
  items: Array<{ quantityGrams: number; costPerKgNet: Prisma.Decimal }>;
  packagingCost: Prisma.Decimal;
  wastePercent: Prisma.Decimal;
  feePercent: Prisma.Decimal;
};

export type RecipeCostResult = {
  ingredientsCost: Prisma.Decimal;
  packagingCost: Prisma.Decimal;
  wasteCost: Prisma.Decimal;
  feeCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
};

export function calcRecipeCost(input: RecipeCostInput): RecipeCostResult {
  let ingredientsCost = new Prisma.Decimal(0);
  for (const item of input.items) {
    const kg = new Prisma.Decimal(item.quantityGrams).div(1000);
    ingredientsCost = ingredientsCost.add(kg.mul(item.costPerKgNet));
  }
  ingredientsCost = ingredientsCost.toDecimalPlaces(2);

  const packagingCost = input.packagingCost.toDecimalPlaces(2);
  const subtotal = ingredientsCost.add(packagingCost);
  const wasteCost = subtotal.mul(input.wastePercent.div(100)).toDecimalPlaces(2);
  const afterWaste = subtotal.add(wasteCost);
  const feeCost = afterWaste.mul(input.feePercent.div(100)).toDecimalPlaces(2);
  const totalCost = afterWaste.add(feeCost).toDecimalPlaces(2);

  return { ingredientsCost, packagingCost, wasteCost, feeCost, totalCost };
}

export function calcSalePrice(
  totalCost: Prisma.Decimal,
  marginPercent: Prisma.Decimal,
  roundIncrement: Prisma.Decimal,
): Prisma.Decimal {
  const raw = totalCost.mul(calcMarkupFactor(marginPercent));
  return roundPrice(raw, roundIncrement);
}

export function calcMarginPercent(salePrice: Prisma.Decimal, totalCost: Prisma.Decimal): Prisma.Decimal {
  if (totalCost.lte(0)) return new Prisma.Decimal(0);
  return salePrice.div(totalCost).sub(1).mul(100).toDecimalPlaces(2);
}

export function calcNetProfit(salePrice: Prisma.Decimal, totalCost: Prisma.Decimal): Prisma.Decimal {
  return salePrice.sub(totalCost).toDecimalPlaces(2);
}

export function suggestMargins(perishable: boolean, settings: {
  defaultMinMargin: Prisma.Decimal;
  defaultIdealMargin: Prisma.Decimal;
  defaultTargetMargin: Prisma.Decimal;
  perishableMarkupBoost: Prisma.Decimal;
}): { safe: Prisma.Decimal; ideal: Prisma.Decimal; premium: Prisma.Decimal } {
  const boost = perishable ? settings.perishableMarkupBoost : new Prisma.Decimal(0);
  return {
    safe: settings.defaultMinMargin.add(boost),
    ideal: settings.defaultIdealMargin.add(boost),
    premium: settings.defaultTargetMargin.add(boost.mul(1.5)),
  };
}
