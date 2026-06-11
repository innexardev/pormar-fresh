'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

type Ingredient = {
  id: string;
  name: string;
  category: string;
  purchaseUnit: string;
  avgYieldPercent: string;
  costPerKgNet: string;
  stockGrossQty: string;
  stockNetQty: string;
  minStock: string;
};

type Movement = {
  id: string;
  type: string;
  quantity: string;
  reason: string | null;
  createdAt: string;
};

const LOSS_TYPES = ['casca', 'sementes', 'folhas', 'estragado', 'limpeza', 'corte'];

export default function IngredientesPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [tab, setTab] = useState<'compra' | 'rendimento' | 'estoque'>('compra');
  const [form, setForm] = useState({ name: '', category: 'fruta', purchaseUnit: 'kg', minStock: '0' });
  const [purchase, setPurchase] = useState({
    supplier: '', purchaseDate: new Date().toISOString().slice(0, 10),
    pricePaid: '', grossWeightGrams: '', netWeightGrams: '', expiryDate: '',
  });
  const [yieldForm, setYieldForm] = useState({
    lossType: 'limpeza', grossWeightGrams: '', netWeightGrams: '', notes: '',
  });

  const load = () => api<Ingredient[]>('/admin/pricing/ingredients').then(setItems);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  useEffect(() => {
    if (!selected) { setMovements([]); return; }
    api<Movement[]>(`/admin/pricing/ingredients/${selected.id}/movements`).then(setMovements);
  }, [selected]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await api('/admin/pricing/ingredients', {
      method: 'POST',
      body: JSON.stringify({ ...form, minStock: Number(form.minStock) }),
    });
    setForm({ name: '', category: 'fruta', purchaseUnit: 'kg', minStock: '0' });
    load();
  }

  async function onPurchase(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await api(`/admin/pricing/ingredients/${selected.id}/purchases`, {
      method: 'POST',
      body: JSON.stringify({
        supplier: purchase.supplier || undefined,
        purchaseDate: purchase.purchaseDate,
        pricePaid: Number(purchase.pricePaid),
        grossWeightGrams: Number(purchase.grossWeightGrams),
        netWeightGrams: Number(purchase.netWeightGrams),
        expiryDate: purchase.expiryDate || undefined,
      }),
    });
    setPurchase({ ...purchase, pricePaid: '', grossWeightGrams: '', netWeightGrams: '', expiryDate: '' });
    refreshSelected();
  }

  async function onYield(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await api(`/admin/pricing/ingredients/${selected.id}/yields`, {
      method: 'POST',
      body: JSON.stringify({
        lossType: yieldForm.lossType,
        grossWeightGrams: Number(yieldForm.grossWeightGrams),
        netWeightGrams: Number(yieldForm.netWeightGrams),
        notes: yieldForm.notes || undefined,
      }),
    });
    setYieldForm({ ...yieldForm, grossWeightGrams: '', netWeightGrams: '', notes: '' });
    refreshSelected();
  }

  async function refreshSelected() {
    const updated = await api<Ingredient[]>('/admin/pricing/ingredients');
    setItems(updated);
    if (selected) {
      const ing = updated.find((i) => i.id === selected.id) ?? null;
      setSelected(ing);
      if (ing) {
        api<Movement[]>(`/admin/pricing/ingredients/${ing.id}/movements`).then(setMovements);
      }
    }
  }

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold">Ingredientes base</h1>

      <form onSubmit={onCreate} className="mb-8 flex flex-wrap gap-2 rounded-lg bg-white p-4 shadow-sm">
        <input className="rounded border px-3 py-2 text-sm" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select className="rounded border px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="fruta">Fruta</option>
          <option value="legume">Legume</option>
          <option value="verdura">Verdura</option>
        </select>
        <select className="rounded border px-3 py-2 text-sm" value={form.purchaseUnit} onChange={(e) => setForm({ ...form, purchaseUnit: e.target.value })}>
          <option value="kg">kg</option>
          <option value="unit">unidade</option>
          <option value="caixa">caixa</option>
          <option value="bandeja">bandeja</option>
        </select>
        <input className="w-24 rounded border px-3 py-2 text-sm" placeholder="Min kg" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
        <button type="submit" className="rounded bg-fresh-600 px-4 py-2 text-sm text-white">Adicionar</button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          {items.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => { setSelected(i); setTab('compra'); }}
              className={`w-full rounded-lg p-3 text-left text-sm shadow-sm ${selected?.id === i.id ? 'bg-fresh-50 border border-fresh-300' : 'bg-white'}`}
            >
              <p className="font-medium">{i.name} <span className="text-gray-400">({i.category})</span></p>
              <p className="text-gray-600">
                R$ {Number(i.costPerKgNet).toFixed(2)}/kg · rend. {Number(i.avgYieldPercent).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500">
                Estoque: {Number(i.stockNetQty).toFixed(2)} kg líq · {Number(i.stockGrossQty).toFixed(2)} kg bruto
              </p>
            </button>
          ))}
        </div>

        {selected && (
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">{selected.name}</h2>
            <div className="mb-4 flex gap-2 text-sm">
              {(['compra', 'rendimento', 'estoque'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded px-3 py-1 capitalize ${tab === t ? 'bg-fresh-600 text-white' : 'bg-gray-100'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === 'compra' && (
              <form onSubmit={onPurchase} className="space-y-3">
                <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Fornecedor" value={purchase.supplier} onChange={(e) => setPurchase({ ...purchase, supplier: e.target.value })} />
                <input type="date" className="w-full rounded border px-3 py-2 text-sm" value={purchase.purchaseDate} onChange={(e) => setPurchase({ ...purchase, purchaseDate: e.target.value })} />
                <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Preço pago (R$)" value={purchase.pricePaid} onChange={(e) => setPurchase({ ...purchase, pricePaid: e.target.value })} required />
                <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Peso bruto (g)" value={purchase.grossWeightGrams} onChange={(e) => setPurchase({ ...purchase, grossWeightGrams: e.target.value })} required />
                <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Peso líquido (g)" value={purchase.netWeightGrams} onChange={(e) => setPurchase({ ...purchase, netWeightGrams: e.target.value })} required />
                <input type="date" className="w-full rounded border px-3 py-2 text-sm" placeholder="Validade" value={purchase.expiryDate} onChange={(e) => setPurchase({ ...purchase, expiryDate: e.target.value })} />
                <button type="submit" className="rounded bg-fresh-600 px-4 py-2 text-sm text-white">Registrar compra</button>
              </form>
            )}

            {tab === 'rendimento' && (
              <form onSubmit={onYield} className="space-y-3">
                <select className="w-full rounded border px-3 py-2 text-sm" value={yieldForm.lossType} onChange={(e) => setYieldForm({ ...yieldForm, lossType: e.target.value })}>
                  {LOSS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Peso bruto processado (g)" value={yieldForm.grossWeightGrams} onChange={(e) => setYieldForm({ ...yieldForm, grossWeightGrams: e.target.value })} required />
                <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Peso líquido resultante (g)" value={yieldForm.netWeightGrams} onChange={(e) => setYieldForm({ ...yieldForm, netWeightGrams: e.target.value })} required />
                <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Observações" value={yieldForm.notes} onChange={(e) => setYieldForm({ ...yieldForm, notes: e.target.value })} />
                <button type="submit" className="rounded bg-fresh-600 px-4 py-2 text-sm text-white">Registrar rendimento</button>
              </form>
            )}

            {tab === 'estoque' && (
              <div className="space-y-2 text-sm">
                <p>Bruto: <strong>{Number(selected.stockGrossQty).toFixed(3)} kg</strong></p>
                <p>Líquido: <strong>{Number(selected.stockNetQty).toFixed(3)} kg</strong></p>
                <p>Mínimo: {Number(selected.minStock).toFixed(3)} kg</p>
                <h3 className="pt-2 font-medium">Movimentações</h3>
                {movements.map((m) => (
                  <div key={m.id} className="rounded bg-gray-50 px-2 py-1 text-xs">
                    {m.type} {Number(m.quantity).toFixed(3)} kg {m.reason && `· ${m.reason}`}
                    <span className="float-right text-gray-400">{new Date(m.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
