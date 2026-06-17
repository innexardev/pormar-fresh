import { PrismaClient } from '@prisma/client';

/** ID determinístico para upsert idempotente */
export function catalogId(kind: 'cat' | 'prod' | 'combo', slug: string): string {
  let n = kind === 'cat' ? 0x100 : kind === 'prod' ? 0x200 : 0x300;
  for (let i = 0; i < slug.length; i++) n = (Math.imul(n, 31) + slug.charCodeAt(i)) >>> 0;
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0').slice(-12)}`;
}

type ComboDef = {
  slug: string;
  name: string;
  description?: string;
  price: number;
  weightLabel: string;
  categorySlug: string;
  featured?: boolean;
  items: string[];
  potGrams: number;
};

type ProductDef = {
  slug: string;
  name: string;
  categorySlug: string;
  weightGrams: number;
  price: number;
  description?: string;
  unitType?: string;
};

const CATEGORIES = [
  { slug: 'kits-individual', name: 'Kits Individual', position: 1 },
  { slug: 'kits-medio', name: 'Kit Médio', position: 2 },
  { slug: 'kits-familia', name: 'Kit Família', position: 3 },
  { slug: 'frutas', name: 'Frutas Avulsas', position: 4 },
  { slug: 'kits-sopa', name: 'Kit Sopa', position: 5 },
  { slug: 'picadinhos', name: 'Picadinhos & Legumes', position: 6 },
  { slug: 'saladas-cozidas', name: 'Saladas Cozidas', position: 7 },
  { slug: 'saladas-folhas', name: 'Saladas Folhas', position: 8 },
  { slug: 'sucos', name: 'Linha Sucos', position: 9 },
] as const;

const KIT_INDIVIDUAL: Array<{ slug: string; name: string; items: string[] }> = [
  { slug: 'individual-classico', name: 'Clássico', items: ['Melancia', 'Melão', 'Abacaxi', 'Manga', 'Morango', 'Uva'] },
  { slug: 'individual-citrico', name: 'Cítrico', items: ['Melancia', 'Melão', 'Abacaxi', 'Laranja', 'Morango', 'Uva'] },
  { slug: 'individual-tropical', name: 'Tropical', items: ['Melancia', 'Melão', 'Abacaxi', 'Manga', 'Mamão', 'Uva'] },
  { slug: 'individual-premium', name: 'Premium', items: ['Melancia', 'Melão', 'Abacaxi', 'Kiwi', 'Morango', 'Uva'] },
];

const KIT_MEDIO: Array<{ slug: string; name: string; items: string[] }> = [
  { slug: 'medio-classico', name: 'Clássico', items: ['Melancia', 'Melão', 'Abacaxi', 'Manga'] },
  { slug: 'medio-vermelho', name: 'Vermelho', items: ['Melancia', 'Morango', 'Uva', 'Laranja'] },
  { slug: 'medio-tropical', name: 'Tropical', items: ['Melão', 'Abacaxi', 'Manga', 'Mamão'] },
  { slug: 'medio-premium', name: 'Premium', items: ['Abacaxi', 'Kiwi', 'Morango', 'Uva'] },
];

const KIT_FAMILIA: Array<{ slug: string; name: string; items: string[] }> = [
  { slug: 'familia-classico', name: 'Clássico', items: ['Melancia', 'Melão', 'Abacaxi', 'Manga'] },
  { slug: 'familia-vermelho', name: 'Vermelho', items: ['Melancia', 'Morango', 'Uva', 'Laranja'] },
  { slug: 'familia-tropical', name: 'Tropical', items: ['Melão', 'Abacaxi', 'Manga', 'Mamão'] },
  { slug: 'familia-premium', name: 'Premium', items: ['Abacaxi', 'Kiwi', 'Morango', 'Uva'] },
];

const KIT_SOPA: Array<{ slug: string; name: string; items: string[] }> = [
  { slug: 'sopa-kit-1', name: 'Kit 1', items: ['Abobrinha', 'Abóbora cabotiá', 'Cenoura', 'Couve-flor'] },
  { slug: 'sopa-kit-2', name: 'Kit 2', items: ['Cenoura', 'Batata', 'Abobrinha', 'Batata doce'] },
  { slug: 'sopa-kit-3', name: 'Kit 3', items: ['Cenoura', 'Batata', 'Chuchu', 'Mandioquinha'] },
  { slug: 'sopa-kit-4', name: 'Kit 4', items: ['Batata', 'Cenoura', 'Abóbora cabotiá', 'Picadinhos legumes'] },
];

const AVULSOS_FRUTAS: ProductDef[] = [
  { slug: 'avulso-melancia', name: 'Melancia', categorySlug: 'frutas', weightGrams: 250, price: 11.9 },
  { slug: 'avulso-morango', name: 'Morango', categorySlug: 'frutas', weightGrams: 250, price: 18.9 },
  { slug: 'avulso-mamao', name: 'Mamão', categorySlug: 'frutas', weightGrams: 250, price: 13.9 },
  { slug: 'avulso-laranja', name: 'Laranja', categorySlug: 'frutas', weightGrams: 250, price: 10.9 },
  { slug: 'avulso-abacaxi', name: 'Abacaxi', categorySlug: 'frutas', weightGrams: 250, price: 12.9 },
  { slug: 'avulso-manga', name: 'Manga', categorySlug: 'frutas', weightGrams: 250, price: 14.9 },
  { slug: 'avulso-melao', name: 'Melão', categorySlug: 'frutas', weightGrams: 250, price: 12.9 },
  { slug: 'avulso-uva', name: 'Uva', categorySlug: 'frutas', weightGrams: 250, price: 16.9 },
  { slug: 'avulso-kiwi', name: 'Kiwi', categorySlug: 'frutas', weightGrams: 250, price: 15.9 },
];

const PICADINHOS: ProductDef[] = [
  { slug: 'pic-abobora-cubos', name: 'Abóbora cabotiá — meia lua ou cubos', categorySlug: 'picadinhos', weightGrams: 300, price: 14.9 },
  { slug: 'pic-cenoura', name: 'Cenoura', categorySlug: 'picadinhos', weightGrams: 300, price: 12.9 },
  { slug: 'pic-vagem', name: 'Vagem', categorySlug: 'picadinhos', weightGrams: 300, price: 15.9 },
  { slug: 'pic-batata', name: 'Batata', categorySlug: 'picadinhos', weightGrams: 300, price: 11.9 },
  { slug: 'pic-abobora-meia-lua', name: 'Abóbora cabotiá — meia lua', categorySlug: 'picadinhos', weightGrams: 300, price: 14.9 },
  { slug: 'pic-batata-doce-rodelas', name: 'Batata doce em rodelas', categorySlug: 'picadinhos', weightGrams: 300, price: 13.9 },
  { slug: 'pic-abobrinha-rodelas', name: 'Abobrinha em rodelas', categorySlug: 'picadinhos', weightGrams: 300, price: 13.9 },
  { slug: 'pic-cenoura-cubos', name: 'Cenoura em cubos', categorySlug: 'picadinhos', weightGrams: 300, price: 12.9 },
  { slug: 'pic-batata-doce', name: 'Batata doce', categorySlug: 'picadinhos', weightGrams: 300, price: 13.9 },
  { slug: 'pic-chuchu', name: 'Chuchu', categorySlug: 'picadinhos', weightGrams: 300, price: 12.9 },
  { slug: 'pic-quiabo', name: 'Quiabo', categorySlug: 'picadinhos', weightGrams: 300, price: 16.9 },
];

const PICADINHOS_MIX: Array<{ slug: string; name: string; items: string[] }> = [
  { slug: 'pic-mix-verde', name: 'Mix verde', items: ['Brócolis', 'Couve-flor', 'Vagem'] },
  { slug: 'pic-mix-colorido', name: 'Mix colorido', items: ['Cenoura', 'Beterraba', 'Vagem'] },
  { slug: 'pic-mix-leve', name: 'Mix leve', items: ['Abobrinha', 'Chuchu', 'Cenoura'] },
];

const SALADAS_COZIDAS: Array<{ slug: string; name: string; items: string[] }> = [
  { slug: 'coz-mix-legumes', name: 'Mix legumes cozidos', items: ['Brócolis', 'Cenoura', 'Couve-flor'] },
  { slug: 'coz-tradicional', name: 'Tradicional', items: ['Vagem', 'Batata', 'Cenoura'] },
  { slug: 'coz-mix-leve', name: 'Mix leve', items: ['Abóbora cabotiá', 'Chuchu', 'Cenoura'] },
  { slug: 'coz-mix-raizes', name: 'Mix raízes', items: ['Abóbora cabotiá', 'Batata doce', 'Cenoura'] },
  { slug: 'coz-fitness', name: 'Fitness', items: ['Brócolis', 'Couve-flor', 'Cenoura'] },
  { slug: 'coz-leves', name: 'Leves', items: ['Abobrinha', 'Chuchu', 'Cenoura'] },
];

const SALADAS_FOLHAS: Array<{ slug: string; name: string; items: string[] }> = [
  { slug: 'folha-tradicional', name: 'Tradicional', items: ['Alface', 'Pepino', 'Cenoura ralada'] },
  { slug: 'folha-verde', name: 'Salada verde', items: ['Alface crespa', 'Alface americana', 'Rúcula'] },
  { slug: 'folha-crocante', name: 'Salada crocante', items: ['Alface americana', 'Repolho roxo', 'Cenoura ralada'] },
  { slug: 'folha-colorida', name: 'Salada colorida', items: ['Alface', 'Cenoura ralada', 'Beterraba ralada'] },
  { slug: 'folha-mix-folhas', name: 'Mix folhas', items: ['Alface crespa', 'Alface americana', 'Rúcula', 'Agrião'] },
  { slug: 'folha-mix-feliz', name: 'Mix feliz', items: ['Cenoura ralada', 'Beterraba ralada'] },
];

const FOLHAS_SEPARADAS: ProductDef[] = [
  { slug: 'sep-alface-crespa', name: 'Alface crespa', categorySlug: 'saladas-folhas', weightGrams: 250, price: 9.9 },
  { slug: 'sep-alface-americana', name: 'Alface americana', categorySlug: 'saladas-folhas', weightGrams: 250, price: 9.9 },
  { slug: 'sep-agriao', name: 'Agrião', categorySlug: 'saladas-folhas', weightGrams: 250, price: 11.9 },
  { slug: 'sep-rucula', name: 'Rúcula', categorySlug: 'saladas-folhas', weightGrams: 250, price: 11.9 },
  { slug: 'sep-repolho-roxo', name: 'Repolho roxo', categorySlug: 'saladas-folhas', weightGrams: 250, price: 10.9 },
  { slug: 'sep-repolho-verde', name: 'Repolho verde', categorySlug: 'saladas-folhas', weightGrams: 250, price: 10.9 },
  { slug: 'sep-couve', name: 'Couve', categorySlug: 'saladas-folhas', weightGrams: 250, price: 10.9 },
];

const SUCOS: Array<{ slug: string; name: string; line: string }> = [
  { slug: 'suco-abacaxi-hortela', name: 'Abacaxi com hortelã', line: 'Tradicionais' },
  { slug: 'suco-laranja-cenoura', name: 'Laranja e cenoura', line: 'Tradicionais' },
  { slug: 'suco-abacaxi-limao', name: 'Abacaxi e limão', line: 'Tradicionais' },
  { slug: 'suco-melancia-limao-hortela', name: 'Melancia, limão e hortelã', line: 'Tradicionais' },
  { slug: 'suco-morango-laranja', name: 'Morango e laranja', line: 'Tradicionais' },
  { slug: 'suco-couve-limao-gengibre', name: 'Couve, limão e gengibre', line: 'Detox' },
  { slug: 'suco-abacaxi-couve-hortela', name: 'Abacaxi, couve e hortelã', line: 'Detox' },
  { slug: 'suco-melancia-gengibre-limao', name: 'Melancia, gengibre e limão', line: 'Detox' },
  { slug: 'suco-pepino-limao-hortela', name: 'Pepino, limão e hortelã', line: 'Detox' },
  { slug: 'suco-morango-banana', name: 'Morango e banana', line: 'Energia' },
  { slug: 'suco-laranja-beterraba', name: 'Laranja e beterraba', line: 'Energia' },
  { slug: 'suco-abacaxi-cenoura', name: 'Abacaxi e cenoura', line: 'Energia' },
  { slug: 'suco-laranja-cenoura-imun', name: 'Laranja e cenoura', line: 'Imunidade' },
  { slug: 'suco-laranja-gengibre', name: 'Laranja e gengibre', line: 'Imunidade' },
  { slug: 'suco-abacaxi-limao-gengibre', name: 'Abacaxi, limão e gengibre', line: 'Imunidade' },
  { slug: 'suco-manga-laranja', name: 'Manga e laranja', line: 'Imunidade' },
  { slug: 'suco-melancia-hortela', name: 'Melancia e hortelã', line: 'Refrescante' },
  { slug: 'suco-laranja-limao', name: 'Laranja e limão', line: 'Refrescante' },
];

function buildCombos(): ComboDef[] {
  const combos: ComboDef[] = [];

  for (const k of KIT_INDIVIDUAL) {
    combos.push({
      slug: k.slug,
      name: `Kit Individual — ${k.name}`,
      description: '6 potes de 250g cada. Frutas frescas cortadas no dia.',
      price: 89.9,
      weightLabel: '6 potes × 250g (1,5 kg)',
      categorySlug: 'kits-individual',
      featured: k.slug === 'individual-classico',
      items: k.items,
      potGrams: 250,
    });
  }

  for (const k of KIT_MEDIO) {
    combos.push({
      slug: k.slug,
      name: `Kit Médio — ${k.name}`,
      description: '4 potes de 400g cada. Ideal para casal ou consumo moderado.',
      price: 79.9,
      weightLabel: '4 potes × 400g (1,6 kg)',
      categorySlug: 'kits-medio',
      featured: k.slug === 'medio-classico',
      items: k.items,
      potGrams: 400,
    });
  }

  for (const k of KIT_FAMILIA) {
    combos.push({
      slug: k.slug,
      name: `Kit Família — ${k.name}`,
      description: '4 potes de 900g cada. Para toda a família.',
      price: 129.9,
      weightLabel: '4 potes × 900g (3,6 kg)',
      categorySlug: 'kits-familia',
      featured: k.slug === 'familia-classico',
      items: k.items,
      potGrams: 900,
    });
  }

  for (const k of KIT_SOPA) {
    combos.push({
      slug: k.slug,
      name: `Kit Sopa — ${k.name}`,
      description: 'Legumes picados prontos para panela. 300g o pacote.',
      price: 32.9,
      weightLabel: '4 pacotes × 300g (1,2 kg)',
      categorySlug: 'kits-sopa',
      featured: k.slug === 'sopa-kit-1',
      items: k.items,
      potGrams: 300,
    });
  }

  for (const m of PICADINHOS_MIX) {
    combos.push({
      slug: m.slug,
      name: `Picadinho — ${m.name}`,
      description: 'Mix de legumes picados. 300g o pacote.',
      price: 18.9,
      weightLabel: '300g',
      categorySlug: 'picadinhos',
      items: m.items,
      potGrams: 300,
    });
  }

  for (const s of SALADAS_COZIDAS) {
    combos.push({
      slug: s.slug,
      name: `Salada cozida — ${s.name}`,
      description: 'Legumes prontos para cozinhar. 300g o pacote.',
      price: 19.9,
      weightLabel: '300g',
      categorySlug: 'saladas-cozidas',
      items: s.items,
      potGrams: 300,
    });
  }

  for (const s of SALADAS_FOLHAS) {
    combos.push({
      slug: s.slug,
      name: `Salada folhas — ${s.name}`,
      description: 'Folhas lavadas e preparadas. 250g o pacote.',
      price: 16.9,
      weightLabel: '250g',
      categorySlug: 'saladas-folhas',
      featured: s.slug === 'folha-verde',
      items: s.items,
      potGrams: 250,
    });
  }

  return combos;
}

export async function seedCatalog(prisma: PrismaClient) {
  const categoryIds = new Map<string, string>();

  for (const c of CATEGORIES) {
    const id = catalogId('cat', c.slug);
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, position: c.position, active: true },
      create: { id, name: c.name, slug: c.slug, position: c.position },
    });
    categoryIds.set(c.slug, row.id);
  }

  // Desativa cardápio demo antigo (IDs fixos do seed anterior)
  const legacyIds = [
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000301',
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000403',
  ];
  await prisma.product.updateMany({ where: { id: { in: legacyIds } }, data: { active: false } });
  await prisma.combo.updateMany({ where: { id: { in: legacyIds } }, data: { active: false } });

  await prisma.category.updateMany({
    where: { slug: { in: ['combos', 'legumes', 'verduras'] } },
    data: { active: false },
  });

  const allProducts: ProductDef[] = [
    ...AVULSOS_FRUTAS,
    ...PICADINHOS,
    ...FOLHAS_SEPARADAS,
    ...SUCOS.map((s) => ({
      slug: s.slug,
      name: s.name,
      categorySlug: 'sucos' as const,
      weightGrams: 1000,
      price: 21.9,
      description: `Linha ${s.line} — rende 1L. Preparado no dia.`,
      unitType: 'portion',
    })),
  ];

  for (const p of allProducts) {
    const catId = categoryIds.get(p.categorySlug)!;
    await prisma.product.upsert({
      where: { id: catalogId('prod', p.slug) },
      update: {
        name: p.name,
        description: p.description ?? `${p.weightGrams}g — cortado no dia`,
        categoryId: catId,
        unitType: p.unitType ?? 'portion',
        weightGrams: p.weightGrams,
        price: p.price,
        stockQty: 50,
        minStock: 10,
        active: true,
        isPreCut: true,
      },
      create: {
        id: catalogId('prod', p.slug),
        categoryId: catId,
        name: p.name,
        description: p.description ?? `${p.weightGrams}g — cortado no dia`,
        unitType: p.unitType ?? 'portion',
        weightGrams: p.weightGrams,
        price: p.price,
        stockQty: 50,
        minStock: 10,
        active: true,
        isPreCut: true,
      },
    });
  }

  const combos = buildCombos();
  for (const c of combos) {
    const catId = categoryIds.get(c.categorySlug)!;
    const comboId = catalogId('combo', c.slug);

    await prisma.combo.upsert({
      where: { id: comboId },
      update: {
        name: c.name,
        description: c.description,
        categoryId: catId,
        price: c.price,
        weightLabel: c.weightLabel,
        featured: c.featured ?? false,
        active: true,
        servesPeople: c.categorySlug.startsWith('kits-familia') ? 4 : c.categorySlug.startsWith('kits-medio') ? 2 : undefined,
      },
      create: {
        id: comboId,
        categoryId: catId,
        name: c.name,
        description: c.description,
        price: c.price,
        weightLabel: c.weightLabel,
        featured: c.featured ?? false,
        active: true,
        servesPeople: c.categorySlug.startsWith('kits-familia') ? 4 : c.categorySlug.startsWith('kits-medio') ? 2 : undefined,
      },
    });

    await prisma.comboItem.deleteMany({ where: { comboId } });
    await prisma.comboItem.createMany({
      data: c.items.map((itemName, sortOrder) => ({
        comboId,
        itemName,
        quantity: c.potGrams,
        unitLabel: 'g',
        sortOrder,
      })),
    });
  }

  console.log(`Cardápio: ${combos.length} combos, ${allProducts.length} produtos avulsos`);
}
