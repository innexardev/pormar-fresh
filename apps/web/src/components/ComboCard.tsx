'use client';

import Link from 'next/link';
import { ProductImage } from './ProductImage';
import { FALLBACK_IMAGES } from '@/lib/images';

type Combo = {
  id: string;
  name: string;
  description?: string;
  price: number;
  weight_label?: string;
  serves_people?: number;
  image_url?: string | null;
  items: Array<{ name: string; quantity: number; unit: string }>;
};

export function ComboCard({
  combo,
  onAdd,
  index = 0,
  compact = false,
}: {
  combo: Combo;
  onAdd?: () => void;
  index?: number;
  compact?: boolean;
}) {
  const delay = Math.min(index * 100, 500);

  return (
    <article
      className="group card-product opacity-0 animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className={`relative ${compact ? 'h-44' : 'h-52'} w-full`}>
        <ProductImage
          src={combo.image_url}
          alt={combo.name}
          fallback={FALLBACK_IMAGES.combo}
          className="h-full w-full"
        />
        {combo.weight_label && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-fresh-700 shadow-sm backdrop-blur">
            {combo.weight_label}
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-stone-900">{combo.name}</h3>
        {combo.description && !compact && (
          <p className="mt-1 line-clamp-2 text-sm text-stone-500">{combo.description}</p>
        )}
        {!compact && (
          <ul className="mt-3 space-y-0.5 text-xs text-stone-400">
            {combo.items.slice(0, 3).map((i, idx) => (
              <li key={idx}>{i.name} — {i.quantity}{i.unit}</li>
            ))}
            {combo.items.length > 3 && <li>+{combo.items.length - 3} itens</li>}
          </ul>
        )}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-fresh-600">R$ {combo.price.toFixed(2)}</p>
            {combo.serves_people && (
              <p className="text-xs text-stone-400">Serve ~{combo.serves_people} pessoas</p>
            )}
          </div>
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-xl bg-fresh-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-fresh-600 hover:shadow-card"
            >
              Adicionar
            </button>
          ) : (
            <Link href="/cardapio" className="text-sm font-semibold text-fresh-600 hover:text-fresh-700">
              Ver →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCard({
  product,
  onAdd,
  index = 0,
}: {
  product: {
    id: string;
    name: string;
    price: number;
    unit_type: string;
    weight_grams?: number;
    image_url?: string | null;
    stock_qty: number;
  };
  onAdd: () => void;
  index?: number;
}) {
  const UNIT: Record<string, string> = { kg: 'kg', g: 'g', unit: 'un', portion: 'porção' };
  const delay = Math.min(index * 80, 400);

  return (
    <article
      className="group card-product flex overflow-hidden opacity-0 animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="relative h-auto w-28 shrink-0 sm:w-32">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          fallback={FALLBACK_IMAGES.fruits}
          className="h-full min-h-[120px] w-full"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="font-semibold text-stone-900">{product.name}</p>
          <p className="text-xs text-stone-400">
            {product.weight_grams ? `${product.weight_grams}g · ` : ''}
            {UNIT[product.unit_type] ?? product.unit_type}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-lg font-bold text-fresh-600">R$ {product.price.toFixed(2)}</p>
          <button
            type="button"
            onClick={onAdd}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-fresh-500 text-lg font-bold text-white shadow-soft transition hover:bg-fresh-600 hover:scale-105"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}
