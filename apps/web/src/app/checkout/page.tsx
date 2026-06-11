'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useCart } from '@/store/cart';

type Window = { id: string; label: string; delivery_date: string; cutoff_at: string };
type Store = { delivery_fee: number; min_order_value: number };

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [windows, setWindows] = useState<Window[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    delivery_window_id: '',
    delivery_date: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    zip_code: '',
    notes: '',
  });

  useEffect(() => {
    fetchApi<Window[]>('/public/delivery/windows').then(setWindows);
    fetchApi<Store>('/public/store').then(setStore);
  }, []);

  const subtotal = cart.total();
  const deliveryFee = store?.delivery_fee ?? 12;
  const total = subtotal + (subtotal > 0 ? deliveryFee : 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cart.items.length || !form.delivery_window_id) return;
    setLoading(true);
    try {
      const order = await fetchApi<{ order_id: string }>('/public/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer: { name: form.name, phone: form.phone, email: form.email || undefined },
          delivery_window_id: form.delivery_window_id,
          delivery_date: form.delivery_date,
          address: {
            street: form.street,
            number: form.number,
            complement: form.complement,
            neighborhood: form.neighborhood,
            city: form.city,
            zip_code: form.zip_code,
          },
          notes: form.notes || undefined,
          items: cart.items.map((i) => ({ type: i.type, id: i.id, quantity: i.qty })),
        }),
      });
      await fetchApi(`/public/orders/${order.order_id}/payments/pix`, { method: 'POST' });
      cart.clear();
      router.push(`/pedido/${order.order_id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao finalizar');
    } finally {
      setLoading(false);
    }
  }

  if (!cart.items.length) {
    return (
      <main className="mx-auto max-w-lg p-8 text-center">
        <p className="mb-4">Seu carrinho esta vazio.</p>
        <Link href="/cardapio" className="text-fresh-600 underline">Ver cardapio</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Finalizar pedido</h1>

      <div className="mb-6 rounded-xl border bg-white p-4">
        {cart.items.map((i) => (
          <div key={`${i.type}-${i.id}`} className="flex justify-between py-2 text-sm">
            <span>{i.qty}x {i.name}</span>
            <span>R$ {(i.price * i.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="mt-2 space-y-1 border-t pt-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Entrega</span><span>R$ {deliveryFee.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
        </div>
        {store && subtotal < store.min_order_value && (
          <p className="mt-2 text-xs text-amber-600">Pedido minimo: R$ {store.min_order_value.toFixed(2)}</p>
        )}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <h2 className="font-semibold">Dados pessoais</h2>
        <input required placeholder="Nome completo" className="w-full rounded-lg border p-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="WhatsApp / Telefone" className="w-full rounded-lg border p-3" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

        <h2 className="pt-4 font-semibold">Dia de entrega (2x por semana)</h2>
        <div className="space-y-2">
          {windows.map((w) => (
            <label key={w.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${form.delivery_window_id === w.id ? 'border-fresh-600 bg-fresh-50' : ''}`}>
              <input
                type="radio"
                name="window"
                required
                checked={form.delivery_window_id === w.id}
                onChange={() => setForm({ ...form, delivery_window_id: w.id, delivery_date: w.delivery_date })}
              />
              <span className="text-sm">{w.label}</span>
            </label>
          ))}
        </div>

        <h2 className="pt-4 font-semibold">Endereco de entrega</h2>
        <input required placeholder="Rua" className="w-full rounded-lg border p-3" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input required placeholder="Numero" className="rounded-lg border p-3" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          <input placeholder="Complemento" className="rounded-lg border p-3" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
        </div>
        <input required placeholder="Bairro" className="w-full rounded-lg border p-3" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
        <input required placeholder="Cidade" className="w-full rounded-lg border p-3" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input required placeholder="CEP" className="w-full rounded-lg border p-3" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} />
        <textarea placeholder="Observacoes (ex: portaria, preferencias de corte)" className="w-full rounded-lg border p-3" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

        <button type="submit" disabled={loading} className="w-full rounded-full bg-fresh-600 py-3 font-semibold text-white disabled:opacity-50">
          {loading ? 'Processando...' : 'Confirmar e pagar com Pix'}
        </button>
      </form>
    </main>
  );
}
