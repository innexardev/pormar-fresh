'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

type Window = { id: string; label: string };
type Combo = { id: string; name: string; price: number; weight_label?: string; featured?: boolean };
type Menu = { combos: Combo[] };

export default function AssinaturaPage() {
  const router = useRouter();
  const [windows, setWindows] = useState<Window[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [selectedCombo, setSelectedCombo] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    delivery_window_id: '',
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
    fetchApi<Menu>('/public/menu').then((m) => setCombos(m.combos.filter((c) => c.featured).length ? m.combos.filter((c) => c.featured) : m.combos.slice(0, 6)));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCombo || !form.delivery_window_id) return;
    setLoading(true);
    try {
      const res = await fetchApi<{ subscription_id: string }>('/public/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          customer: { name: form.name, phone: form.phone, email: form.email || undefined },
          delivery_window_id: form.delivery_window_id,
          address: {
            street: form.street,
            number: form.number,
            complement: form.complement,
            neighborhood: form.neighborhood,
            city: form.city,
            zip_code: form.zip_code,
          },
          notes: form.notes || undefined,
          items: [{ type: 'combo', id: selectedCombo, quantity: 1 }],
        }),
      });
      router.push(`/assinatura/sucesso?id=${res.subscription_id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao assinar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-stone-900">Assinatura semanal</h1>
      <p className="mt-2 text-stone-600">Receba o mesmo combo toda semana na sua janela de entrega preferida.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <section>
          <h2 className="mb-2 font-semibold">Escolha o combo</h2>
          <div className="space-y-2">
            {combos.map((c) => (
              <label key={c.id} className={`flex cursor-pointer justify-between rounded-lg border p-3 ${selectedCombo === c.id ? 'border-fresh-600 bg-fresh-50' : ''}`}>
                <span>
                  <input type="radio" name="combo" required checked={selectedCombo === c.id} onChange={() => setSelectedCombo(c.id)} className="mr-2" />
                  {c.name}
                </span>
                <span className="font-semibold text-fresh-700">R$ {c.price.toFixed(2)}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Dia de entrega preferido</h2>
          {windows.slice(0, 2).map((w) => (
            <label key={w.id} className={`mb-2 flex cursor-pointer rounded-lg border p-3 ${form.delivery_window_id === w.id ? 'border-fresh-600 bg-fresh-50' : ''}`}>
              <input type="radio" name="window" required checked={form.delivery_window_id === w.id} onChange={() => setForm({ ...form, delivery_window_id: w.id })} className="mr-2" />
              {w.label.split('—')[0].trim()}
            </label>
          ))}
        </section>

        <input required placeholder="Nome" className="w-full rounded-lg border p-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required placeholder="WhatsApp" className="w-full rounded-lg border p-3" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Rua" required className="w-full rounded-lg border p-3" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input required placeholder="Número" className="rounded-lg border p-3" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          <input placeholder="CEP" required className="rounded-lg border p-3" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} />
        </div>
        <input required placeholder="Bairro" className="w-full rounded-lg border p-3" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
        <input required placeholder="Cidade" className="w-full rounded-lg border p-3" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />

        <button type="submit" disabled={loading} className="w-full rounded-full bg-fresh-600 py-3 font-semibold text-white disabled:opacity-50">
          {loading ? 'Salvando...' : 'Assinar agora'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Cada semana você receberá um pedido para pagar via Pix. <Link href="/entrega" className="text-fresh-600 underline">Áreas de entrega</Link>
      </p>
    </main>
  );
}
