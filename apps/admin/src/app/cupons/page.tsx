'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { NumberInput, PriceInput, SelectInput, TextInput } from '@/components/FormFields';
import { PageHeaderDesktop } from '@/components/AdminUI';
import { api, token } from '@/lib/api';
import { parseDecimal } from '@/lib/format';

type Promo = {
  id: string;
  code: string;
  discountType: string;
  discountValue: string | number;
  active: boolean;
  usesCount: number;
  maxUses: number | null;
};

const EMPTY = {
  code: '',
  discountType: 'percent',
  discountValue: '10',
  minOrderValue: '',
  maxUses: '',
};

export default function CuponsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => api<Promo[]>('/admin/promo-codes').then(setPromos);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setShowModal(true);
  }

  function openEdit(p: Promo) {
    setEditingId(p.id);
    setForm({
      code: p.code,
      discountType: p.discountType,
      discountValue: String(p.discountValue),
      minOrderValue: '',
      maxUses: p.maxUses?.toString() ?? '',
    });
    setShowModal(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const discountValue = parseDecimal(form.discountValue);
    if (discountValue === null) { setSaving(false); return; }
    const minOrderValue = form.minOrderValue ? parseDecimal(form.minOrderValue) : null;
    try {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        discountValue,
        minOrderValue: minOrderValue ?? undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      };
      if (editingId) {
        await api(`/admin/promo-codes/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/admin/promo-codes', { method: 'POST', body: JSON.stringify(payload) });
      }
      setForm(EMPTY);
      setShowModal(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string, currentActive: boolean) {
    await api(`/admin/promo-codes/${id}`, { method: 'PATCH', body: JSON.stringify({ active: !currentActive }) });
    load();
  }

  async function deleteCupon(p: Promo) {
    if (!confirm(`Excluir cupom "${p.code}"?`)) return;
    try {
      await api(`/admin/promo-codes/${p.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir cupom');
    }
  }

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Cupons"
        description="Gerencie códigos promocionais e descontos."
        action={
          <button type="button" onClick={openCreate} className="admin-btn-primary">
            + Novo cupom
          </button>
        }
      />
      <div className="mb-4 flex items-center justify-between xl:hidden">
        <p className="text-sm text-stone-500">{promos.length} cupom(ns)</p>
        <button type="button" onClick={openCreate} className="admin-btn-primary text-sm">
          + Novo cupom
        </button>
      </div>

      <div className="space-y-3">
        {promos.map((p) => (
          <div key={p.id} className="admin-card flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-stone-900">{p.code}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${p.active ? 'bg-fresh-100 text-fresh-800' : 'bg-stone-100 text-stone-500'}`}>
                  {p.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-stone-600">
                {p.discountType === 'percent' ? `${Number(p.discountValue)}% de desconto` : `R$ ${Number(p.discountValue).toFixed(2)} de desconto`}
                {p.maxUses && ` · máx. ${p.maxUses} usos`}
              </p>
              <p className="text-xs text-stone-400">{p.usesCount} uso(s)</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => void toggle(p.id, p.active)}
                className={`admin-btn-secondary py-1.5 text-sm ${p.active ? 'text-amber-600' : 'text-fresh-700'}`}
              >
                {p.active ? 'Desativar' : 'Ativar'}
              </button>
              <button type="button" onClick={() => openEdit(p)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-fresh-700 hover:bg-fresh-50">
                Editar
              </button>
              <button type="button" onClick={() => void deleteCupon(p)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {!promos.length && (
          <div className="admin-card border-dashed py-12 text-center text-stone-500">
            Nenhum cupom criado.
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar cupom' : 'Novo cupom'}
        subtitle={editingId ? 'Altere os dados do cupom.' : 'Crie um código promocional de desconto.'}
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary w-full sm:w-auto">Cancelar</button>
            <button type="submit" form="cupom-form" disabled={saving} className="admin-btn-primary w-full sm:w-auto disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar cupom'}
            </button>
          </div>
        }
      >
        <form id="cupom-form" onSubmit={save} className="space-y-4">
          <TextInput label="Código do cupom" required value={form.code} onChange={(code) => setForm({ ...form, code: code.toUpperCase() })} />
          <SelectInput label="Tipo de desconto" value={form.discountType} onChange={(discountType) => setForm({ ...form, discountType })}>
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </SelectInput>
          {form.discountType === 'fixed' ? (
            <PriceInput label="Valor do desconto" required value={form.discountValue} onChange={(discountValue) => setForm({ ...form, discountValue })} />
          ) : (
            <NumberInput label="Percentual de desconto" suffix="%" required min={1} max={100} value={form.discountValue} onChange={(discountValue) => setForm({ ...form, discountValue })} />
          )}
          <PriceInput label="Pedido mínimo" hint="Opcional — aplica apenas acima deste valor" value={form.minOrderValue} onChange={(minOrderValue) => setForm({ ...form, minOrderValue })} />
          <NumberInput label="Máximo de usos" hint="Opcional — vazio = ilimitado" min={1} value={form.maxUses} onChange={(maxUses) => setForm({ ...form, maxUses })} />
        </form>
      </Modal>
    </AdminShell>
  );
}
