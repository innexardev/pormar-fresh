/** URLs verificadas (Unsplash) — use ?auto=format&fit=crop para estabilidade */
function u(id: string, w: number) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}

export const FALLBACK_IMAGES = {
  hero: [
    u('1540420773420-3366772f4999', 1200),
    u('1488459716781-31db52582fe9', 1200),
    u('1546069901-ba9599a7e63c', 1200),
  ],
  combo: u('1512621776951-a57141f2eefd', 600),
  fruits: u('1571771894821-ce9b6c11b08e', 600),
  salad: u('1546069901-ba9599a7e63c', 600),
  product: u('1601493700631-2b16ec4b4716', 600),
  legumes: u('1576045057995-568f588f82fb', 600),
  mango: u('1459411621453-7b03977f4bfc', 600),
  market: u('1488459716781-31db52582fe9', 600),
};

export const HOME_CARDS_DEFAULT = [
  {
    title: 'Cortado no dia',
    description: 'Preparamos no dia da entrega para máxima frescura.',
    image_url: FALLBACK_IMAGES.salad,
  },
  {
    title: '2 entregas/semana',
    description: 'Terça e sexta — planeje sua semana com antecedência.',
    image_url: FALLBACK_IMAGES.fruits,
  },
  {
    title: 'Combos & avulsos',
    description: 'Escolha combos prontos ou monte com produtos avulsos.',
    image_url: FALLBACK_IMAGES.legumes,
  },
];

export function resolveImage(url: string | null | undefined, fallback: string): string {
  return url && url.trim().length > 0 ? url : fallback;
}

/** Filtra URLs inválidas conhecidas (404 no Unsplash) */
const BROKEN = new Set([
  'photo-1610348726531-843f061a3974',
  'photo-1498837167922-ddd27525cd47',
  'photo-1619566636852-156b2a4949a2',
  'photo-1597361909610-b8d4a948a628',
  'photo-1464965911861-7467460502bb',
]);

export function sanitizeImageUrl(url: string | null | undefined, fallback: string): string {
  if (!url?.trim()) return fallback;
  for (const id of BROKEN) {
    if (url.includes(id)) return fallback;
  }
  return withMediaCacheBust(url);
}

/** Contorna 403 em cache da CDN para arquivos MinIO. */
export function withMediaCacheBust(url: string): string {
  if (!url.includes('/media/pomar-fresh/')) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('t')) {
      parsed.searchParams.set('t', 'v2');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
