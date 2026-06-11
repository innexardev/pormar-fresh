'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

type Packaging = {
  id: string;
  name: string;
  type: string;
  sizeLabel: string;
  unitCost: string;
  capacityGrams: number | null;
  capacityMl: number | null;
};

export default function EmbalagensPage() {
  const [items, setItems] = useState<Packaging[]>([]);
  const [form, setForm] = useState({ name: '', type: 'pote', sizeLabel: '', unitCost: '', capacityGrams: '', capacityMl: '' });

  const load = () => api<Packaging[]>('/admin/pricing/packaging').then(setItems);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api('/admin/pricing/packaging', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        sizeLabel: form.sizeLabel,
        unitCost: Number(form.unitCost),
        capacityGrams: form.capacityGrams ? Number(form.capacityGrams) : undefined,
        capacityMl: form.capacityMl ? Number(form.capacityMl) : undefined,
      }),
    });
    setForm({ name: '', type: 'pote', sizeLabel: '', unitCost: '', capacityGrams: '', capacityMl: '' });
    load();
  }

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold">Embalagens</h1>

      <form onSubmit={onSubmit} className="mb-8 grid gap-2 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <input className="rounded border px-3 py-2 text-sm" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="rounded border px-3 py-2 text-sm" placeholder="Tipo (pote, bandeja...)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        <input className="rounded border px-3 py-2 text-sm" placeholder="Tamanho (500ml)" value={form.sizeLabel} onChange={(e) => setForm({ ...form, sizeLabel: e.target.value })} required />
        <input className="rounded border px-3 py-2 text-sm" placeholder="Custo unitário (R$)" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} required />
        <input className="rounded border px-3 py-2 text-sm" placeholder="Capacidade (g)" value={form.capacityGrams} onChange={(e) => setForm({ ...form, capacityGrams: e.target.value })} />
        <input className="rounded border px-3 py-2 text-sm" placeholder="Capacidade (ml)" value={form.capacityMl} onChange={(e) => setForm({ ...form, capacityMl: e.target.value })} />
        <button type="submit" className="rounded bg-fresh-600 px-4 py-2 text-sm text-white sm:col-span-2 lg:col-span-1">Adicionar</button>
      </form>

      <div className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="rounded-lg bg-white p-3 text-sm shadow-sm">
            <p className="font-medium">{p.name} — {p.sizeLabel}</p>
            <p className="text-gray-600">{p.type} · {Number(p.unitCost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
