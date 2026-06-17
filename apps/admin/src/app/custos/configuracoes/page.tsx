'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { CheckboxInput, TextInput } from '@/components/FormFields';
import { api, token } from '@/lib/api';

type Settings = {
  defaultTargetMargin: string;
  defaultMinMargin: string;
  defaultIdealMargin: string;
  roundIncrement: string;
  autoUpdatePrices: boolean;
  perishableMarkupBoost: string;
  yieldHistorySize: number;
};

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    api<Settings>('/admin/pricing/settings').then(setForm);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    await api('/admin/pricing/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        defaultTargetMargin: Number(form.defaultTargetMargin),
        defaultMinMargin: Number(form.defaultMinMargin),
        defaultIdealMargin: Number(form.defaultIdealMargin),
        roundIncrement: Number(form.roundIncrement),
        autoUpdatePrices: form.autoUpdatePrices,
        perishableMarkupBoost: Number(form.perishableMarkupBoost),
        yieldHistorySize: form.yieldHistorySize,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!form) return <AdminShell><p>Carregando...</p></AdminShell>;

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold">Configurações de preço</h1>

      <form onSubmit={onSubmit} className="max-w-lg space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <TextInput label="Lucro desejado (%)" value={form.defaultTargetMargin} onChange={(v) => setForm({ ...form, defaultTargetMargin: v })} />
        <TextInput label="Margem mínima (%)" value={form.defaultMinMargin} onChange={(v) => setForm({ ...form, defaultMinMargin: v })} />
        <TextInput label="Margem ideal (%)" value={form.defaultIdealMargin} onChange={(v) => setForm({ ...form, defaultIdealMargin: v })} />
        <TextInput label="Arredondamento (R$)" hint="Ex: 0,50 para arredondar em R$ 0,50" value={form.roundIncrement} onChange={(v) => setForm({ ...form, roundIncrement: v })} />
        <TextInput label="Boost perecíveis (%)" value={form.perishableMarkupBoost} onChange={(v) => setForm({ ...form, perishableMarkupBoost: v })} />
        <TextInput label="Histórico de rendimento" hint="Quantos registros manter" value={String(form.yieldHistorySize)} onChange={(v) => setForm({ ...form, yieldHistorySize: Number(v) })} />

        <CheckboxInput
          label="Atualizar preços automaticamente ao registrar compra"
          checked={form.autoUpdatePrices}
          onChange={(autoUpdatePrices) => setForm({ ...form, autoUpdatePrices })}
        />

        <button type="submit" className="rounded bg-fresh-600 px-4 py-2 text-sm text-white">Salvar</button>
        {saved && <span className="ml-2 text-sm text-green-600">Salvo!</span>}
      </form>
    </AdminShell>
  );
}
