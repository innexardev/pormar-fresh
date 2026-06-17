import Link from 'next/link';
import Image from 'next/image';
import { fetchApi } from '@/lib/api';
import { HeroSection } from '@/components/HeroSection';
import { ComboCard } from '@/components/ComboCard';
import { FALLBACK_IMAGES, HOME_CARDS_DEFAULT, sanitizeImageUrl, withMediaCacheBust } from '@/lib/images';

type Store = {
  name: string;
  tagline?: string;
  min_order_value: number;
  delivery_fee: number;
  hero_image_url?: string | null;
  hero_fallback_urls?: string[];
  home_cards?: Array<{ title: string; description: string; image_url: string }>;
};

type Menu = {
  combos: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    weight_label?: string;
    serves_people?: number;
    featured: boolean;
    image_url?: string | null;
    items: Array<{ name: string; quantity: number; unit: string }>;
  }>;
};

const DEFAULT_CARDS = HOME_CARDS_DEFAULT;

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let store: Store = { name: 'Pomar Fresh', min_order_value: 49, delivery_fee: 12 };
  let featuredCombos: Menu['combos'] = [];

  try {
    const [storeData, menuData] = await Promise.all([
      fetchApi<Store>('/public/store'),
      fetchApi<Menu>('/public/menu'),
    ]);
    store = storeData;
    featuredCombos = menuData.combos.filter((c) => c.featured).slice(0, 4);
  } catch {
    /* API offline — fallbacks */
  }

  const homeCards = (store.home_cards?.length ? store.home_cards : DEFAULT_CARDS).map((c) => ({
    ...c,
    image_url: sanitizeImageUrl(c.image_url, FALLBACK_IMAGES.salad),
  }));

  return (
    <main>
      <HeroSection
        storeName={store.name}
        tagline={store.tagline}
        heroImage={store.hero_image_url}
        heroFallbacks={store.hero_fallback_urls}
      />

      {featuredCombos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-fresh-500">Destaques</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-stone-900 md:text-4xl">
              Combos mais pedidos
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCombos.map((combo, i) => (
              <ComboCard key={combo.id} combo={combo} index={i} compact />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/cardapio" className="btn-outline">
              Ver cardápio completo
            </Link>
          </div>
        </section>
      )}

      <section className="bg-gradient-to-b from-white to-fresh-50/50 px-4 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {homeCards.map((item, i) => (
            <div
              key={item.title}
              className="group overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-card-hover opacity-0 animate-fade-up"
              style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'forwards' }}
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={withMediaCacheBust(item.image_url || FALLBACK_IMAGES.salad)}
                  alt={item.title}
                  fill
                  unoptimized={item.image_url?.includes('/media/pomar-fresh/')}
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-fresh-900/40 to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-fresh-800">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-fresh-600 px-4 py-16 text-center text-white">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-fresh-400/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-fresh-300/20 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold">Pronto para começar?</h2>
          <p className="mt-3 text-fresh-100">
            Pedido mínimo R$ {store.min_order_value.toFixed(2)} · Entrega a partir de R$ {store.delivery_fee.toFixed(2)}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-fresh-100">
            <Link href="/entrega" className="underline hover:text-white">Ver áreas de entrega</Link>
          </div>
          <Link href="/cardapio" className="mt-8 inline-block rounded-full bg-white px-10 py-3.5 font-semibold text-fresh-700 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
            Fazer pedido
          </Link>
        </div>
      </section>
    </main>
  );
}
