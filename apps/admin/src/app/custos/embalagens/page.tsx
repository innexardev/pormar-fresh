'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { NumberInput, PriceInput, TextInput } from '@/components/FormFields';
import { PageHeaderDesktop } from '@/components/AdminUI';
import { api, token } from '@/lib/api';
import { formatCurrency, parseDecimal } from '@/lib/format';

type Packaging = {
  id: string;
  name: string;
  type: string;
  sizeLabel: string;
  unitCost: string;
  capacityGrams: number | null;
  capacityMl: number | null;
};

const EMPTY = { name: '', type: 'pote', sizeLabel: '', unitCost: '', capacityGrams: '', capacityMl: '' };

export default function EmbalagensPage() {
  const [items, setItems] = useState<Packaging[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => api<Packaging[]>('/admin/pricing/packaging').then(setItems);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
    setShowModal(true);
  }

  function openEdit(p: Packaging) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      type: p.type,
      sizeLabel: p.sizeLabel,
      unitCost: String(p.unitCost),
      capacityGrams: p.capacityGrams?.toString() ?? '',
      capacityMl: p.capacityMl?.toString() ?? '',
    });
    setError('');
    setShowModal(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const unitCost = parseDecimal(form.unitCost);
    if (unitCost === null) {
      setError('Informe o custo unitário (ex: 1,50)');
      setSaving(false);
      return;
    }
    try {
      const payload = {
        name: form.name,
        type: form.type,
        sizeLabel: form.sizeLabel,
        unitCost,
        capacityGrams: form.capacityGrams ? Number(form.capacityGrams) : undefined,
        capacityMl: form.capacityMl ? Number(form.capacityMl) : undefined,
      };
      if (editingId) {
        await api(`/admin/pricing/packaging/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/admin/pricing/packaging', { method: 'POST', body: JSON.stringify(payload) });
      }
      setForm(EMPTY);
      setShowModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar embalagem');
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(p: Packaging) {
    if (!confirm(`Excluir "${p.name}"? Receitas que usam esta embalagem podem ser afetadas.`)) return;
    try {
      await api(`/admin/pricing/packaging/${p.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir embalagem');
    }
  }

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Embalagens"
        description="Cadastre embalagens e seus custos para cálculo de receitas."
        action={
          <button type="button" onClick={openCreate} className="admin-btn-primary">
            + Nova embalagem
          </button>
        }
      />
      <div className="mb-4 flex items-center justify-between xl:hidden">
        <p className="text-sm text-stone-500">{items.length} embalagem(ns)</p>
        <button type="button" onClick={openCreate} className="admin-btn-primary text-sm">
          + Nova embalagem
        </button>
      </div>

      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="admin-card flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-stone-900">{p.name} — {p.sizeLabel}</p>
              <p className="text-sm text-stone-500">{p.type} · {formatCurrency(p.unitCost)}</p>
              {(p.capacityGrams || p.capacityMl) && (
                <p className="text-xs text-stone-400">
                  {p.capacityGrams ? `${p.capacityGrams}g` : ''}{p.capacityGrams && p.capacityMl ? ' · ' : ''}{p.capacityMl ? `${p.capacityMl}ml` : ''}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="mr-2 font-bold text-fresh-700">{formatCurrency(p.unitCost)}</span>
              <button type="button" onClick={() => openEdit(p)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-fresh-700 hover:bg-fresh-50">
                Editar
              </button>
              <button type="button" onClick={() => void deleteItem(p)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="admin-card border-dashed py-12 text-center text-stone-500">
            Nenhuma embalagem cadastrada.
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar embalagem' : 'Nova embalagem'}
        subtitle={editingId ? 'Altere os dados e salve.' : 'Cadastre uma embalagem com seu custo unitário.'}
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary w-full sm:w-auto">Cancelar</button>
            <button type="submit" form="embalagem-form" disabled={saving} className="admin-btn-primary w-full sm:w-auto disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar embalagem'}
            </button>
          </div>
        }
      >
        <form id="embalagem-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <TextInput label="Nome" hint="Ex: Pote PET 500ml" required value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <TextInput label="Tipo" hint="Pote, bandeja, sacola..." value={form.type} onChange={(type) => setForm({ ...form, type })} />
          <TextInput label="Tamanho / rótulo" hint="Ex: 500ml" required value={form.sizeLabel} onChange={(sizeLabel) => setForm({ ...form, sizeLabel })} />
          <PriceInput label="Custo unitário" hint="Quanto você paga por unidade" required value={form.unitCost} onChange={(unitCost) => setForm({ ...form, unitCost })} />
          <NumberInput label="Capacidade" hint="Peso máximo em gramas" suffix="g" min={0} value={form.capacityGrams} onChange={(capacityGrams) => setForm({ ...form, capacityGrams })} />
          <NumberInput label="Volume" hint="Volume em mililitros" suffix="ml" min={0} value={form.capacityMl} onChange={(capacityMl) => setForm({ ...form, capacityMl })} />
        </form>
      </Modal>
    </AdminShell>
  );
}
