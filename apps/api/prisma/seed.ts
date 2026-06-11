import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@freshbox.com' },
    update: {},
    create: { email: 'admin@freshbox.com', passwordHash, fullName: 'Administrador' },
  });

  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {
      storeName: 'Pomar Fresh',
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

  const catCombos = await prisma.category.upsert({
    where: { slug: 'combos' },
    update: {},
    create: { name: 'Combos', slug: 'combos', position: 1 },
  });
  const catFrutas = await prisma.category.upsert({
    where: { slug: 'frutas' },
    update: {},
    create: { name: 'Frutas', slug: 'frutas', position: 2 },
  });
  const catLegumes = await prisma.category.upsert({
    where: { slug: 'legumes' },
    update: {},
    create: { name: 'Legumes', slug: 'legumes', position: 3 },
  });
  const catVerduras = await prisma.category.upsert({
    where: { slug: 'verduras' },
    update: {},
    create: { name: 'Verduras', slug: 'verduras', position: 4 },
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

  const morango = await prisma.product.upsert({
    where: { id: '00000000-0000-4000-8000-000000000101' },
    update: { imageUrl: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=600&q=80' },
    create: {
      id: '00000000-0000-4000-8000-000000000101',
      categoryId: catFrutas.id,
      name: 'Morango cortado',
      description: 'Recipiente 300g, cortado no dia',
      unitType: 'portion',
      weightGrams: 300,
      price: 18.9,
      stockQty: 40,
      minStock: 10,
      imageUrl: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=600&q=80',
    },
  });

  await prisma.product.upsert({
    where: { id: '00000000-0000-4000-8000-000000000102' },
    update: { imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80' },
    create: {
      id: '00000000-0000-4000-8000-000000000102',
      categoryId: catFrutas.id,
      name: 'Manga em cubos',
      unitType: 'portion',
      weightGrams: 400,
      price: 14.9,
      stockQty: 30,
      minStock: 8,
      imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80',
    },
  });

  await prisma.product.upsert({
    where: { id: '00000000-0000-4000-8000-000000000201' },
    update: { imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80' },
    create: {
      id: '00000000-0000-4000-8000-000000000201',
      categoryId: catLegumes.id,
      name: 'Cenoura ralada',
      unitType: 'kg',
      weightGrams: 500,
      price: 9.9,
      stockQty: 25,
      minStock: 5,
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
    },
  });

  await prisma.product.upsert({
    where: { id: '00000000-0000-4000-8000-000000000301' },
    update: { imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
    create: {
      id: '00000000-0000-4000-8000-000000000301',
      categoryId: catVerduras.id,
      name: 'Alface americana picada',
      unitType: 'portion',
      weightGrams: 200,
      price: 8.9,
      stockQty: 35,
      minStock: 10,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    },
  });

  const comboSalada = await prisma.combo.upsert({
    where: { id: '00000000-0000-4000-8000-000000000401' },
    update: { imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80' },
    create: {
      id: '00000000-0000-4000-8000-000000000401',
      categoryId: catCombos.id,
      name: 'Combo Salada da Semana',
      description: 'Mix de folhas, tomate, pepino e cenoura — tudo lavado e cortado',
      price: 59.9,
      weightLabel: '~1,2 kg total',
      servesPeople: 4,
      featured: true,
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    },
  });

  await prisma.comboItem.deleteMany({ where: { comboId: comboSalada.id } });
  await prisma.comboItem.createMany({
    data: [
      { comboId: comboSalada.id, itemName: 'Alface picada', quantity: 200, unitLabel: 'g', sortOrder: 0 },
      { comboId: comboSalada.id, itemName: 'Tomate cereja', quantity: 300, unitLabel: 'g', sortOrder: 1 },
      { comboId: comboSalada.id, itemName: 'Pepino fatiado', quantity: 250, unitLabel: 'g', sortOrder: 2 },
      { comboId: comboSalada.id, itemName: 'Cenoura ralada', quantity: 200, unitLabel: 'g', sortOrder: 3, productId: '00000000-0000-4000-8000-000000000201' },
    ],
  });

  const comboFrutas = await prisma.combo.upsert({
    where: { id: '00000000-0000-4000-8000-000000000402' },
    update: { imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80' },
    create: {
      id: '00000000-0000-4000-8000-000000000402',
      categoryId: catCombos.id,
      name: 'Combo Frutas do Dia',
      description: 'Selecao variada de frutas frescas cortadas em recipientes',
      price: 69.9,
      weightLabel: '~1 kg total',
      servesPeople: 3,
      featured: true,
      imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    },
  });

  await prisma.comboItem.deleteMany({ where: { comboId: comboFrutas.id } });
  await prisma.comboItem.createMany({
    data: [
      { comboId: comboFrutas.id, itemName: 'Morango', quantity: 300, unitLabel: 'g', sortOrder: 0, productId: morango.id },
      { comboId: comboFrutas.id, itemName: 'Manga', quantity: 400, unitLabel: 'g', sortOrder: 1 },
      { comboId: comboFrutas.id, itemName: 'Melancia', quantity: 400, unitLabel: 'g', sortOrder: 2 },
      { comboId: comboFrutas.id, itemName: 'Uva verde', quantity: 250, unitLabel: 'g', sortOrder: 3 },
    ],
  });

  await prisma.combo.upsert({
    where: { id: '00000000-0000-4000-8000-000000000403' },
    update: { imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80' },
    create: {
      id: '00000000-0000-4000-8000-000000000403',
      categoryId: catCombos.id,
      name: 'Combo Sopas & Caldos',
      description: 'Legumes picados prontos para panela de pressao',
      price: 54.9,
      weightLabel: '~1,5 kg',
      servesPeople: 6,
      featured: false,
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
    },
  });

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
      comboId: comboFrutas.id,
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
