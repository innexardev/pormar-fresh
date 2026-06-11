'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useCart } from '@/store/cart';
import { ComboCard, ProductCard } from '@/components/ComboCard';

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
  products: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    unit_type: string;
    weight_grams?: number;
    stock_qty: number;
    image_url?: string | null;
  }>;
};

export default function CardapioPage() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const cart = useCart();

  useEffect(() => {
    fetchApi<Menu>('/public/menu').then(setMenu);
  }, []);

  if (!menu) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fresh-200 border-t-fresh-500" />
      </div>
    );
  }

  const featured = menu.combos.filter((c) => c.featured);
  const otherCombos = menu.combos.filter((c) => !c.featured);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 pb-32">
      <div className="mb-12 animate-fade-up">
        <p className="text-sm font-semibold uppercase tracking-widest text-fresh-500">Cardápio</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-stone-900">Escolha seus favoritos</h1>
        <p className="mt-2 text-stone-500">Combos prontos ou produtos avulsos por peso e porção.</p>
      </div>

      <section id="combos" className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-bold text-fresh-800">Combos em destaque</h2>
        <div className="grid gap-6 md:grid-cols-2">
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

      {otherCombos.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-stone-800">Outros combos</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {otherCombos.map((combo, i) => (
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

      <section>
        <h2 className="mb-6 font-display text-2xl font-bold text-stone-800">Produtos avulsos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menu.products.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              index={i}
              onAdd={() =>
                cart.add({
                  type: 'product',
                  id: p.id,
                  name: p.name,
                  price: p.price,
                  unit: p.unit_type,
                })
              }
            />
          ))}
        </div>
      </section>

      {cart.count() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-fresh-200/60 glass p-4 shadow-card">
          <Link
            href="/checkout"
            className="mx-auto block max-w-6xl rounded-full bg-fresh-500 py-4 text-center font-semibold text-white shadow-soft transition hover:bg-fresh-600 animate-fade-in"
          >
            Carrinho ({cart.count()}) — R$ {cart.total().toFixed(2)}
          </Link>
        </div>
      )}
    </main>
  );
}
