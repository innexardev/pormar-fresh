import Link from 'next/link';
import { fetchApi } from '@/lib/api';

type Zone = {
  label: string;
  delivery_fee: number;
  zip_prefixes: string[];
  neighborhoods: string[];
};

type Store = { min_order_value: number; delivery_fee: number; whatsapp?: string };

export const metadata = {
  title: 'Áreas de entrega',
  description: 'Confira as regiões atendidas pelo Pomar Fresh e taxas de entrega.',
};

export default async function EntregaPage() {
  let zones: Zone[] = [];
  let store: Store = { min_order_value: 49, delivery_fee: 12 };

  try {
    [zones, store] = await Promise.all([
      fetchApi<Zone[]>('/public/delivery/zones'),
      fetchApi<Store>('/public/store'),
    ]);
  } catch {
    /* API offline */
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-stone-900">Áreas de entrega</h1>
      <p className="mt-2 text-stone-600">
        Entregamos <strong>2x por semana</strong> (terça e sexta). Pedido mínimo R$ {store.min_order_value.toFixed(2)}.
      </p>

      {zones.length > 0 ? (
        <div className="mt-8 space-y-4">
          {zones.map((z) => (
            <div key={z.label} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex justify-between">
                <h2 className="font-semibold text-fresh-800">{z.label}</h2>
                <span className="font-bold text-fresh-600">R$ {z.delivery_fee.toFixed(2)}</span>
              </div>
              <p className="mt-2 text-sm text-stone-500">
                CEPs: {z.zip_prefixes.length ? z.zip_prefixes.join(', ') : 'consulte no checkout'}
                {z.neighborhoods.length > 0 && ` · Bairros: ${z.neighborhoods.join(', ')}`}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-xl bg-fresh-50 p-5 text-stone-700">
          Taxa de entrega padrão: <strong>R$ {store.delivery_fee.toFixed(2)}</strong>.
          Informe seu CEP no checkout para confirmar disponibilidade.
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/cardapio" className="rounded-full bg-fresh-600 px-6 py-3 font-semibold text-white">
          Ver cardápio
        </Link>
        {store.whatsapp && (
          <a
            href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-green-600 px-6 py-3 font-semibold text-green-700"
          >
            Falar no WhatsApp
          </a>
        )}
      </div>
    </main>
  );
}
