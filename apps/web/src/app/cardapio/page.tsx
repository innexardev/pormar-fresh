'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useCart } from '@/store/cart';
import { ComboCard, ProductCard } from '@/components/ComboCard';
import { CategoryNav, CategorySidebar } from '@/components/CategoryNav';

type Combo = {
  id: string;
  name: string;
  description?: string;
  price: number;
  weight_label?: string;
  serves_people?: number;
  featured: boolean;
  image_url?: string | null;
  category_slug?: string | null;
  category_name?: string | null;
  items: Array<{ name: string; quantity: number; unit: string }>;
};

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit_type: string;
  weight_grams?: number;
  stock_qty: number;
  image_url?: string | null;
  category_slug?: string | null;
  category_name?: string | null;
};

type Menu = {
  categories: Array<{ id: string; name: string; slug: string }>;
  combos: Combo[];
  products: Product[];
};

function matchesSearch(name: string, q: string) {
  return !q || name.toLowerCase().includes(q.toLowerCase());
}

export default function CardapioPage() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [search, setSearch] = useState('');
  const cart = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCat = searchParams.get('cat') ?? 'all';

  function setActiveCat(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'all') {
      params.delete('cat');
    } else {
      params.set('cat', cat);
    }
    router.replace(`/cardapio${params.size ? `?${params.toString()}` : ''}`, { scroll: false });
  }

  useEffect(() => {
    fetchApi<Menu>('/public/menu').then(setMenu);
  }, []);

  const tabs = useMemo(() => {
    if (!menu) return [{ id: 'all', label: 'Todos', count: 0 }];
    const counts = new Map<string, number>();
    for (const c of menu.combos) {
      if (c.category_slug) counts.set(c.category_slug, (counts.get(c.category_slug) ?? 0) + 1);
    }
    for (const p of menu.products) {
      if (p.category_slug) counts.set(p.category_slug, (counts.get(p.category_slug) ?? 0) + 1);
    }
    const total = menu.combos.length + menu.products.length;
    return [
      { id: 'all', label: 'Todos', count: total },
      ...menu.categories
        .filter((cat) => counts.has(cat.slug))
        .map((cat) => ({ id: cat.slug, label: cat.name, count: counts.get(cat.slug) ?? 0 })),
    ];
  }, [menu]);

  // On mobile: filter by active category. On desktop: always show grouped.
  const sections = useMemo(() => {
    if (!menu) return [];
    const q = search.trim();
    return menu.categories
      .map((cat) => {
        const combos = menu.combos.filter(
          (c) => c.category_slug === cat.slug && matchesSearch(c.name, q),
        );
        const products = menu.products.filter(
          (p) => p.category_slug === cat.slug && matchesSearch(p.name, q),
        );
        return { cat, combos, products };
      })
      .filter((s) => s.combos.length > 0 || s.products.length > 0);
  }, [menu, search]);

  // Mobile filtered view
  const mobileFiltered = useMemo(() => {
    if (!menu) return { combos: [] as Combo[], products: [] as Product[] };
    const q = search.trim();
    let combos = menu.combos.filter((c) => matchesSearch(c.name, q));
    let products = menu.products.filter((p) => matchesSearch(p.name, q));
    if (activeCat !== 'all') {
      combos = combos.filter((c) => c.category_slug === activeCat);
      products = products.filter((p) => p.category_slug === activeCat);
    }
    return { combos, products };
  }, [menu, activeCat, search]);

  const featured = useMemo(() => {
    if (!menu) return [];
    return menu.combos.filter((c) => c.featured);
  }, [menu]);

  if (!menu) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fresh-200 border-t-fresh-500" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-32">
      {/* Page header */}
      <div className="mb-6 animate-fade-up">
        <p className="text-sm font-semibold uppercase tracking-widest text-fresh-500">Cardápio</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-stone-900 lg:text-4xl">Escolha seus favoritos</h1>
        <p className="mt-1 text-stone-500">Produtos frescos, cortados no dia da entrega.</p>
      </div>

      {/* Mobile: sticky horizontal tabs */}
      <CategoryNav
        tabs={tabs}
        active={activeCat}
        onChange={setActiveCat}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Layout: sidebar + content */}
      <div className="mt-6 flex gap-8">
        {/* Desktop sidebar */}
        <CategorySidebar
          tabs={tabs}
          search={search}
          onSearchChange={setSearch}
        />

        {/* Content area */}
        <div className="min-w-0 flex-1">

          {/* Desktop: always show grouped sections */}
          <div className="hidden lg:block space-y-14">
            {featured.length > 0 && !search.trim() && (
              <section>
                <h2 className="mb-5 font-display text-2xl font-bold text-fresh-800">⭐ Destaques</h2>
                <div className="grid gap-5 md:grid-cols-2">
                  {featured.map((combo, i) => (
                    <ComboCard
                      key={combo.id}
                      combo={combo}
                      index={i}
                      onAdd={() => cart.add({ type: 'combo', id: combo.id, name: combo.name, price: combo.price })}
                    />
                  ))}
                </div>
              </section>
            )}

            {sections.map(({ cat, combos, products }) => (
              <section key={cat.slug} id={`cat-${cat.slug}`} className="scroll-mt-24">
                <h2 className="mb-5 font-display text-2xl font-bold text-stone-800 border-b border-stone-100 pb-3">
                  {cat.name}
                </h2>
                {combos.length > 0 && (
                  <div className="mb-6 grid gap-5 md:grid-cols-2">
                    {combos.map((combo, i) => (
                      <ComboCard
                        key={combo.id}
                        combo={combo}
                        index={i}
                        onAdd={() => cart.add({ type: 'combo', id: combo.id, name: combo.name, price: combo.price })}
                      />
                    ))}
                  </div>
                )}
                {products.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((p, i) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        index={i}
                        onAdd={() =>
                          cart.add({ type: 'product', id: p.id, name: p.name, price: p.price, unit: p.unit_type })
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}

            {sections.length === 0 && search.trim() && (
              <p className="py-12 text-center text-stone-500">Nenhum item encontrado para "{search}".</p>
            )}
          </div>

          {/* Mobile: filtered view */}
          <div className="lg:hidden mt-6 space-y-14">
            {activeCat === 'all' && !search.trim() ? (
              <>
                {featured.length > 0 && (
                  <section>
                    <h2 className="mb-5 font-display text-2xl font-bold text-fresh-800">Destaques</h2>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {featured.map((combo, i) => (
                        <ComboCard
                          key={combo.id}
                          combo={combo}
                          index={i}
                          onAdd={() => cart.add({ type: 'combo', id: combo.id, name: combo.name, price: combo.price })}
                        />
                      ))}
                    </div>
                  </section>
                )}
                {sections.map(({ cat, combos, products }) => (
                  <section key={cat.slug} id={`cat-${cat.slug}`} className="scroll-mt-36">
                    <h2 className="mb-5 font-display text-2xl font-bold text-stone-800">{cat.name}</h2>
                    {combos.length > 0 && (
                      <div className="mb-5 grid gap-5 sm:grid-cols-2">
                        {combos.map((combo, i) => (
                          <ComboCard
                            key={combo.id}
                            combo={combo}
                            index={i}
                            onAdd={() => cart.add({ type: 'combo', id: combo.id, name: combo.name, price: combo.price })}
                          />
                        ))}
                      </div>
                    )}
                    {products.length > 0 && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {products.map((p, i) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            index={i}
                            onAdd={() =>
                              cart.add({ type: 'product', id: p.id, name: p.name, price: p.price, unit: p.unit_type })
                            }
                          />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </>
            ) : (
              <>
                {mobileFiltered.combos.length > 0 && (
                  <section>
                    <h2 className="mb-5 font-display text-2xl font-bold text-stone-800">Combos</h2>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {mobileFiltered.combos.map((combo, i) => (
                        <ComboCard
                          key={combo.id}
                          combo={combo}
                          index={i}
                          onAdd={() => cart.add({ type: 'combo', id: combo.id, name: combo.name, price: combo.price })}
                        />
                      ))}
                    </div>
                  </section>
                )}
                {mobileFiltered.products.length > 0 && (
                  <section>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {mobileFiltered.products.map((p, i) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          index={i}
                          onAdd={() =>
                            cart.add({ type: 'product', id: p.id, name: p.name, price: p.price, unit: p.unit_type })
                          }
                        />
                      ))}
                    </div>
                  </section>
                )}
                {mobileFiltered.combos.length === 0 && mobileFiltered.products.length === 0 && (
                  <p className="py-12 text-center text-stone-500">Nenhum item nesta categoria.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cart bar */}
      {cart.count() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-fresh-200/60 glass p-4 shadow-card">
          <div className="mx-auto max-w-7xl space-y-3">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-stone-700">
                Ver carrinho ({cart.count()} itens)
              </summary>
              <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                {cart.items.map((i) => (
                  <li key={`${i.type}-${i.id}`} className="flex items-center justify-between gap-2">
                    <span className="truncate">{i.name}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" className="h-7 w-7 rounded border" onClick={() => cart.setQty(i.type, i.id, i.qty - 1)}>−</button>
                      <span className="w-5 text-center">{i.qty}</span>
                      <button type="button" className="h-7 w-7 rounded border" onClick={() => cart.setQty(i.type, i.id, i.qty + 1)}>+</button>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
            <Link
              href="/checkout"
              className="block rounded-full bg-fresh-500 py-4 text-center font-semibold text-white shadow-soft transition hover:bg-fresh-600 animate-fade-in"
            >
              Finalizar — R$ {cart.total().toFixed(2)}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
