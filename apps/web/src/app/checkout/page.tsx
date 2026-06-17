'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useCart } from '@/store/cart';

type Window = {
  slot_key: string;
  id: string;
  label: string;
  delivery_date: string;
  cutoff_at: string;
  cutoff_label: string;
  available: boolean;
  unavailable_reason?: string;
};
type Store = { delivery_fee: number; min_order_value: number };
type DeliveryQuote = { allowed: boolean; delivery_fee: number; message?: string; zone_label?: string };
type PublicZone = { label: string; delivery_fee: number; zip_prefixes: string[]; neighborhoods: string[] };

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [windows, setWindows] = useState<Window[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [publicZones, setPublicZones] = useState<PublicZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    delivery_window_id: '',
    delivery_date: '',
    slot_key: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    zip_code: '',
    notes: '',
  });

  useEffect(() => {
    fetchApi<Window[]>('/public/delivery/windows').then((list) => {
      setWindows(list);
      const first = list.find((w) => w.available);
      if (first) {
        setForm((f) =>
          f.slot_key
            ? f
            : {
                ...f,
                slot_key: first.slot_key,
                delivery_window_id: first.id,
                delivery_date: first.delivery_date,
              },
        );
      }
    });
    fetchApi<Store>('/public/store').then(setStore);
    fetchApi<PublicZone[]>('/public/delivery/zones').then(setPublicZones).catch(() => setPublicZones([]));
  }, []);

  const subtotal = cart.total();
  const deliveryFee = deliveryQuote?.delivery_fee ?? store?.delivery_fee ?? 12;
  const total = Math.max(0, subtotal + (subtotal > 0 ? deliveryFee : 0) - discount);
  const minOk = !store || subtotal >= store.min_order_value;
  const addressOk = deliveryQuote?.allowed !== false;

  async function lookupCep() {
    const cep = form.zip_code.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const data = await fetchApi<{
        street: string;
        neighborhood: string;
        city: string;
        delivery: DeliveryQuote;
      }>(`/public/delivery/cep/${cep}`);
      setForm((f) => ({
        ...f,
        street: data.street || f.street,
        neighborhood: data.neighborhood || f.neighborhood,
        city: data.city || f.city,
      }));
      setDeliveryQuote(data.delivery);
    } catch {
      setDeliveryQuote({ allowed: false, delivery_fee: deliveryFee, message: 'CEP inválido' });
    } finally {
      setCepLoading(false);
    }
  }

  async function applyPromo() {
    setPromoError('');
    if (!promoCode.trim()) return;
    try {
      const res = await fetchApi<{ discount: number }>('/public/promo/validate', {
        method: 'POST',
        body: JSON.stringify({ code: promoCode, subtotal }),
      });
      setDiscount(res.discount);
    } catch (err) {
      setDiscount(0);
      setPromoError(err instanceof Error ? err.message : 'Cupom inválido');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cart.items.length || !form.delivery_window_id || !form.slot_key || !minOk || !addressOk) return;
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
          promo_code: promoCode.trim() || undefined,
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
        <p className="mb-4">Seu carrinho está vazio.</p>
        <Link href="/cardapio" className="text-fresh-600 underline">Ver cardápio</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Finalizar pedido</h1>

      <div className="mb-6 rounded-xl border bg-white p-4">
        {cart.items.map((i) => (
          <div key={`${i.type}-${i.id}`} className="flex items-center justify-between gap-2 py-2 text-sm">
            <span className="flex-1">{i.name}</span>
            <div className="flex items-center gap-2">
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded border" onClick={() => cart.setQty(i.type, i.id, i.qty - 1)}>−</button>
              <span className="w-6 text-center">{i.qty}</span>
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded border" onClick={() => cart.setQty(i.type, i.id, i.qty + 1)}>+</button>
            </div>
            <span className="w-20 text-right">R$ {(i.price * i.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="mt-2 space-y-1 border-t pt-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Entrega{deliveryQuote?.zone_label ? ` (${deliveryQuote.zone_label})` : ''}</span><span>R$ {deliveryFee.toFixed(2)}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span>− R$ {discount.toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
        </div>
        {store && subtotal < store.min_order_value && (
          <p className="mt-2 text-xs text-amber-600">Pedido mínimo: R$ {store.min_order_value.toFixed(2)}</p>
        )}
      </div>

      <div className="mb-6 flex gap-2">
        <input placeholder="Cupom de desconto" className="flex-1 rounded-lg border p-3 text-sm" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
        <button type="button" onClick={applyPromo} className="rounded-lg border border-fresh-600 px-4 text-sm text-fresh-700">Aplicar</button>
      </div>
      {promoError && <p className="mb-4 text-sm text-red-600">{promoError}</p>}

      <form onSubmit={submit} className="space-y-3">
        <h2 className="font-semibold">Dados pessoais</h2>
        <input required placeholder="Nome completo" className="w-full rounded-lg border p-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="WhatsApp / Telefone" className="w-full rounded-lg border p-3" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input type="email" placeholder="E-mail (opcional)" className="w-full rounded-lg border p-3" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

        <h2 className="pt-4 font-semibold">Dia de entrega</h2>
        <p className="text-xs text-stone-500">Datas com prazo encerrado não podem ser selecionadas.</p>
        <div className="space-y-2">
          {windows.map((w) => (
            <label
              key={w.slot_key}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                !w.available ? 'cursor-not-allowed border-stone-200 bg-stone-50 opacity-60' : 'cursor-pointer'
              } ${form.slot_key === w.slot_key ? 'border-fresh-600 bg-fresh-50' : ''}`}
            >
              <input
                type="radio"
                name="window"
                required={w.available}
                disabled={!w.available}
                checked={form.slot_key === w.slot_key}
                onChange={() =>
                  setForm({
                    ...form,
                    slot_key: w.slot_key,
                    delivery_window_id: w.id,
                    delivery_date: w.delivery_date,
                  })
                }
              />
              <span className="text-sm">
                {w.label}
                {w.available ? (
                  <span className="mt-0.5 block text-xs text-stone-500">Pedidos até {w.cutoff_label}</span>
                ) : (
                  <span className="mt-0.5 block text-xs text-red-600">{w.unavailable_reason}</span>
                )}
              </span>
            </label>
          ))}
        </div>

        <h2 className="pt-4 font-semibold">Endereço</h2>
        <div className="flex gap-2">
          <input required placeholder="CEP" className="w-full rounded-lg border p-3" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} onBlur={lookupCep} />
          <button type="button" onClick={lookupCep} disabled={cepLoading} className="shrink-0 rounded-lg border px-4 text-sm">{cepLoading ? '...' : 'Buscar'}</button>
        </div>
        {deliveryQuote && !deliveryQuote.allowed && (
          <p className="text-sm text-red-600">{deliveryQuote.message ?? 'Fora da área de entrega'}</p>
        )}
        {deliveryQuote?.allowed && deliveryQuote.zone_label && (
          <p className="text-sm text-green-700">Área: {deliveryQuote.zone_label} — entrega R$ {deliveryFee.toFixed(2)}</p>
        )}
        {publicZones.length > 0 && !deliveryQuote && (
          <details className="text-xs text-stone-500">
            <summary className="cursor-pointer">Ver áreas de entrega</summary>
            <ul className="mt-2 space-y-1">
              {publicZones.map((z) => (
                <li key={z.label}>{z.label} — R$ {z.delivery_fee.toFixed(2)} (CEP {z.zip_prefixes.join(', ') || '—'})</li>
              ))}
            </ul>
          </details>
        )}
        <input required placeholder="Rua" className="w-full rounded-lg border p-3" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input required placeholder="Número" className="rounded-lg border p-3" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          <input placeholder="Complemento" className="rounded-lg border p-3" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
        </div>
        <input required placeholder="Bairro" className="w-full rounded-lg border p-3" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
        <input required placeholder="Cidade" className="w-full rounded-lg border p-3" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <textarea placeholder="Observações" className="w-full rounded-lg border p-3" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

        <button type="submit" disabled={loading || !minOk || !addressOk} className="w-full rounded-full bg-fresh-600 py-3 font-semibold text-white disabled:opacity-50">
          {loading ? 'Processando...' : 'Confirmar e pagar com Pix'}
        </button>
      </form>
    </main>
  );
}
