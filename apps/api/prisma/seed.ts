import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedCatalog, catalogId } from './seed-catalog';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const driverPin = process.env.DRIVER_PIN || '847291';
  const driverPinHash = await bcrypt.hash(driverPin, 10);

  const depotAddress = {
    street: process.env.DEPOT_STREET || 'Av. Presidente Kennedy',
    number: process.env.DEPOT_NUMBER || '1000',
    complement: process.env.DEPOT_COMPLEMENT || '',
    neighborhood: process.env.DEPOT_NEIGHBORHOOD || 'Vila Mirim',
    city: process.env.DEPOT_CITY || 'Praia Grande',
    state: process.env.DEPOT_STATE || 'SP',
    zip_code: process.env.DEPOT_ZIP_CODE || '11705000',
  };

  await prisma.user.upsert({
    where: { email: 'admin@freshbox.com' },
    update: {},
    create: { email: 'admin@freshbox.com', passwordHash, fullName: 'Administrador' },
  });

  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {
      storeName: 'Pomar Fresh',
      driverPinHash,
      depotAddressJson: depotAddress,
      tagline: 'Frutas, legumes e verduras frescas — cortados no dia da entrega',
      heroImageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
      heroFallbackUrls: [
        'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
      ],
      homeCardsJson: [
        { title: 'Cortado no dia', description: 'Preparamos no dia da entrega para maxima frescura.', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
        { title: '2 entregas/semana', description: 'Terca e sexta — planeje sua semana.', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80' },
        { title: 'Combos & avulsos', description: 'Escolha combos prontos ou monte do seu jeito.', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80' },
      ],
    },
    create: {
      id: 'default',
      storeName: 'Pomar Fresh',
      driverPinHash,
      depotAddressJson: depotAddress,
      tagline: 'Frutas, legumes e verduras frescas — cortados no dia da entrega',
      deliveryFee: 12,
      minOrderValue: 49,
      whatsapp: '5511999999999',
      aboutText:
        'Combos praticos em recipientes, ideais para sua semana. Entregamos 2x por semana com tudo fresquinho e cortado no dia.',
      heroImageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
      heroFallbackUrls: [
        'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
      ],
      homeCardsJson: [
        { title: 'Cortado no dia', description: 'Preparamos no dia da entrega para maxima frescura.', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
        { title: '2 entregas/semana', description: 'Terca e sexta — planeje sua semana.', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80' },
        { title: 'Combos & avulsos', description: 'Escolha combos prontos ou monte do seu jeito.', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80' },
      ],
    },
  });

  await prisma.deliveryWindow.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      label: 'Terca-feira',
      weekday: 2,
      cutoffWeekday: 1,
      cutoffHour: 18,
      sortOrder: 1,
    },
  });
  await prisma.deliveryWindow.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      label: 'Sexta-feira',
      weekday: 5,
      cutoffWeekday: 4,
      cutoffHour: 18,
      sortOrder: 2,
    },
  });

  await seedCatalog(prisma);

  console.log('Seed OK');
  console.log('Admin: admin@freshbox.com / admin123');

  // --- Pomar Fresh: modulo custo e preco (demo) ---
  await prisma.pricingSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });

  const ingMelancia = await prisma.ingredient.upsert({
    where: { id: '00000000-0000-4000-8000-000000000501' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000501',
      name: 'Melancia',
      category: 'fruta',
      purchaseUnit: 'kg',
      costPerKgNet: 4.5,
      avgYieldPercent: 75,
      stockNetQty: 20,
      stockGrossQty: 26.67,
    },
  });
  const ingMelao = await prisma.ingredient.upsert({
    where: { id: '00000000-0000-4000-8000-000000000502' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000502',
      name: 'Melão',
      category: 'fruta',
      purchaseUnit: 'kg',
      costPerKgNet: 6.0,
      avgYieldPercent: 70,
      stockNetQty: 15,
      stockGrossQty: 21.43,
    },
  });
  const ingManga = await prisma.ingredient.upsert({
    where: { id: '00000000-0000-4000-8000-000000000503' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000503',
      name: 'Manga',
      category: 'fruta',
      purchaseUnit: 'kg',
      costPerKgNet: 8.0,
      avgYieldPercent: 65,
      stockNetQty: 10,
      stockGrossQty: 15.38,
    },
  });
  const ingMorango = await prisma.ingredient.upsert({
    where: { id: '00000000-0000-4000-8000-000000000504' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000504',
      name: 'Morango',
      category: 'fruta',
      purchaseUnit: 'bandeja',
      costPerKgNet: 35.0,
      avgYieldPercent: 90,
      stockNetQty: 5,
      stockGrossQty: 5.56,
      perishable: true,
    },
  });
  const ingAbacaxi = await prisma.ingredient.upsert({
    where: { id: '00000000-0000-4000-8000-000000000505' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000505',
      name: 'Abacaxi',
      category: 'fruta',
      purchaseUnit: 'unit',
      costPerKgNet: 10.0,
      avgYieldPercent: 66,
      stockNetQty: 8,
      stockGrossQty: 12.12,
    },
  });

  await prisma.ingredientPurchase.upsert({
    where: { id: '00000000-0000-4000-8000-000000000601' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000601',
      ingredientId: ingAbacaxi.id,
      supplier: 'CEASA',
      purchaseDate: new Date(),
      pricePaid: 12,
      grossWeightGrams: 1800,
      netWeightGrams: 1200,
      yieldPercent: 66.67,
      costPerKgNet: 10,
    },
  });

  const pote500 = await prisma.packaging.upsert({
    where: { id: '00000000-0000-4000-8000-000000000701' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000701',
      name: 'Pote PET',
      type: 'pote',
      sizeLabel: '500ml',
      unitCost: 1.1,
      capacityMl: 500,
      capacityGrams: 500,
    },
  });

  const recipeTropical = await prisma.recipe.upsert({
    where: { id: '00000000-0000-4000-8000-000000000801' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000801',
      name: 'Pote Tropical 500ml',
      comboId: catalogId('combo', 'individual-tropical'),
      packagingId: pote500.id,
      targetMarginPercent: 120,
      computedCost: 5.3,
      suggestedPrice: 11.7,
    },
  });

  await prisma.recipeItem.deleteMany({ where: { recipeId: recipeTropical.id } });
  await prisma.recipeItem.createMany({
    data: [
      { recipeId: recipeTropical.id, ingredientId: ingMelancia.id, quantityGrams: 120, sortOrder: 0 },
      { recipeId: recipeTropical.id, ingredientId: ingMelao.id, quantityGrams: 100, sortOrder: 1 },
      { recipeId: recipeTropical.id, ingredientId: ingManga.id, quantityGrams: 60, sortOrder: 2 },
      { recipeId: recipeTropical.id, ingredientId: ingMorango.id, quantityGrams: 40, sortOrder: 3 },
    ],
  });

  console.log('Pomar Fresh pricing module seeded');

  await seedComboRecipes(prisma);

  await prisma.deliveryZone.updateMany({
    where: { id: { in: ['00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000011'] } },
    data: { active: false },
  });

  await prisma.deliveryZone.upsert({
    where: { id: '00000000-0000-4000-8000-000000000012' },
    update: {
      label: 'Praia Grande — SP',
      zipPrefixes: ['11700', '11701', '11702', '11703', '11704', '11705', '11706', '11707'],
      neighborhoods: [],
      deliveryFee: 12,
      sortOrder: 1,
      active: true,
    },
    create: {
      id: '00000000-0000-4000-8000-000000000012',
      label: 'Praia Grande — SP',
      zipPrefixes: ['11700', '11701', '11702', '11703', '11704', '11705', '11706', '11707'],
      neighborhoods: [],
      deliveryFee: 12,
      sortOrder: 1,
      active: true,
    },
  });

  console.log('Zona de entrega: Praia Grande (CEP 11700–11707)');

  await prisma.promoCode.upsert({
    where: { code: 'POMAR10' },
    update: {},
    create: {
      code: 'POMAR10',
      discountType: 'percent',
      discountValue: 10,
      minOrderValue: 49,
      active: true,
      maxUses: 100,
    },
  });

  console.log('Delivery zones and promo POMAR10 seeded');
}

/** Cria receitas automaticamente para combos que ainda não têm (BOM / checkout). */
async function seedComboRecipes(prisma: PrismaClient) {
  const ingredients = await prisma.ingredient.findMany();
  const byName = new Map(ingredients.map((i) => [i.name.toLowerCase(), i]));

  const combos = await prisma.combo.findMany({
    where: { active: true },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });

  let created = 0;
  for (const combo of combos) {
    const existing = await prisma.recipe.findFirst({ where: { comboId: combo.id, active: true } });
    if (existing) continue;

    const recipeItems = combo.items
      .map((ci) => {
        const ing = byName.get(ci.itemName.toLowerCase());
        if (!ing) return null;
        return {
          ingredientId: ing.id,
          quantityGrams: Number(ci.quantity),
          sortOrder: ci.sortOrder,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (recipeItems.length === 0) continue;

    await prisma.recipe.create({
      data: {
        name: `Receita — ${combo.name}`,
        comboId: combo.id,
        active: true,
        items: { create: recipeItems },
      },
    });
    created++;
  }

  console.log(`Receitas auto-geradas: ${created} combos`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
