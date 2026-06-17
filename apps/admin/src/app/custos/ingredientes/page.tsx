'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { NumberInput, PriceInput, SelectInput, TextInput } from '@/components/FormFields';
import { PageHeaderDesktop, MobileSheet } from '@/components/AdminUI';
import { api, token } from '@/lib/api';
import { parseDecimal } from '@/lib/format';

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

type Movement = { id: string; type: string; quantity: string; reason: string | null; createdAt: string };

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
  const [yieldForm, setYieldForm] = useState({ lossType: 'limpeza', grossWeightGrams: '', netWeightGrams: '', notes: '' });
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => api<Ingredient[]>('/admin/pricing/ingredients').then(setItems);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  useEffect(() => {
    if (!selected) { setMovements([]); return; }
    api<Movement[]>(`/admin/pricing/ingredients/${selected.id}/movements`).then(setMovements);
  }, [selected]);

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: '', category: 'fruta', purchaseUnit: 'kg', minStock: '0' });
    setShowModal(true);
  }

  function openEditModal(i: Ingredient) {
    setEditingId(i.id);
    setForm({
      name: i.name,
      category: i.category,
      purchaseUnit: i.purchaseUnit,
      minStock: i.minStock,
    });
    setShowModal(true);
  }

  async function deleteIngredient(i: Ingredient) {
    if (!confirm(`Excluir "${i.name}"? Receitas que usam este ingrediente podem ser afetadas.`)) return;
    try {
      await api(`/admin/pricing/ingredients/${i.id}`, { method: 'DELETE' });
      if (selected?.id === i.id) setSelected(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir ingrediente');
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api(`/admin/pricing/ingredients/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...form, minStock: Number(form.minStock) }),
        });
      } else {
        await api('/admin/pricing/ingredients', {
          method: 'POST',
          body: JSON.stringify({ ...form, minStock: Number(form.minStock) }),
        });
      }
      setForm({ name: '', category: 'fruta', purchaseUnit: 'kg', minStock: '0' });
      setShowModal(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function onPurchase(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const pricePaid = parseDecimal(purchase.pricePaid);
    if (pricePaid === null) return;
    await api(`/admin/pricing/ingredients/${selected.id}/purchases`, {
      method: 'POST',
      body: JSON.stringify({
        supplier: purchase.supplier || undefined,
        purchaseDate: purchase.purchaseDate,
        pricePaid,
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
      if (ing) api<Movement[]>(`/admin/pricing/ingredients/${ing.id}/movements`).then(setMovements);
    }
  }

  function openDetail(i: Ingredient) {
    setSelected(i);
    setTab('compra');
    setShowDetail(true);
  }

  const DetailContent = () => !selected ? null : (
    <div>
      <div className="mb-4 flex gap-2">
        {(['compra', 'rendimento', 'estoque'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`chip-filter ${tab === t ? 'chip-filter-active' : ''}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'compra' && (
        <form onSubmit={onPurchase} className="space-y-3">
          <TextInput label="Fornecedor" value={purchase.supplier} onChange={(supplier) => setPurchase({ ...purchase, supplier })} />
          <TextInput label="Data da compra" type="date" required value={purchase.purchaseDate} onChange={(purchaseDate) => setPurchase({ ...purchase, purchaseDate })} />
          <PriceInput label="Preço pago" hint="Valor total" required value={purchase.pricePaid} onChange={(pricePaid) => setPurchase({ ...purchase, pricePaid })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberInput label="Peso bruto" suffix="g" required min={1} value={purchase.grossWeightGrams} onChange={(v) => setPurchase({ ...purchase, grossWeightGrams: v })} />
            <NumberInput label="Peso líquido" suffix="g" required min={1} value={purchase.netWeightGrams} onChange={(v) => setPurchase({ ...purchase, netWeightGrams: v })} />
          </div>
          <TextInput label="Validade" type="date" value={purchase.expiryDate} onChange={(expiryDate) => setPurchase({ ...purchase, expiryDate })} />
          <button type="submit" className="admin-btn-primary w-full">Registrar compra</button>
        </form>
      )}

      {tab === 'rendimento' && (
        <form onSubmit={onYield} className="space-y-3">
          <SelectInput label="Tipo de perda" value={yieldForm.lossType} onChange={(lossType) => setYieldForm({ ...yieldForm, lossType })}>
            {LOSS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </SelectInput>
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberInput label="Peso bruto processado" suffix="g" required min={1} value={yieldForm.grossWeightGrams} onChange={(v) => setYieldForm({ ...yieldForm, grossWeightGrams: v })} />
            <NumberInput label="Peso líquido resultante" suffix="g" required min={1} value={yieldForm.netWeightGrams} onChange={(v) => setYieldForm({ ...yieldForm, netWeightGrams: v })} />
          </div>
          <TextInput label="Observações" value={yieldForm.notes} onChange={(notes) => setYieldForm({ ...yieldForm, notes })} />
          <button type="submit" className="admin-btn-primary w-full">Registrar rendimento</button>
        </form>
      )}

      {tab === 'estoque' && (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="admin-card">
              <p className="text-xs text-stone-500">Estoque bruto</p>
              <p className="mt-1 font-bold text-stone-900">{Number(selected.stockGrossQty).toFixed(3)} kg</p>
            </div>
            <div className="admin-card">
              <p className="text-xs text-stone-500">Estoque líquido</p>
              <p className="mt-1 font-bold text-fresh-700">{Number(selected.stockNetQty).toFixed(3)} kg</p>
            </div>
          </div>
          <p className="text-xs text-stone-500">Mínimo: {Number(selected.minStock).toFixed(3)} kg</p>
          <h3 className="mt-3 font-semibold text-stone-800">Movimentações</h3>
          <div className="space-y-1">
            {movements.map((m) => (
              <div key={m.id} className="flex justify-between rounded-lg bg-stone-50 px-3 py-2 text-xs">
                <span>{m.type} · {Number(m.quantity).toFixed(3)} kg {m.reason && `· ${m.reason}`}</span>
                <span className="text-stone-400">{new Date(m.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Ingredientes base"
        description="Controle de compras, rendimento e custo por kg líquido."
        action={
          <button type="button" onClick={openCreateModal} className="admin-btn-primary">
            + Novo ingrediente
          </button>
        }
      />
      <div className="mb-4 flex items-center justify-between xl:hidden">
        <p className="text-sm text-stone-500">{items.length} ingrediente(s)</p>
        <button type="button" onClick={openCreateModal} className="admin-btn-primary text-sm">
          + Novo ingrediente
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {items.map((i) => (
            <div
              key={i.id}
              className={`admin-card transition ${selected?.id === i.id ? 'border-fresh-300 bg-fresh-50/50 ring-2 ring-fresh-200' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={() => openDetail(i)} className="min-w-0 flex-1 text-left">
                  <p className="font-semibold text-stone-900">{i.name}</p>
                  <p className="text-xs text-stone-500 capitalize">{i.category} · {i.purchaseUnit}</p>
                  <div className="mt-1 flex items-center gap-3 text-sm">
                    <span className="font-bold text-fresh-700">R$ {Number(i.costPerKgNet).toFixed(2)}/kg</span>
                    <span className="text-xs text-stone-500">rend. {Number(i.avgYieldPercent).toFixed(0)}%</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Estoque: {Number(i.stockNetQty).toFixed(2)} kg líq · {Number(i.stockGrossQty).toFixed(2)} kg bruto
                  </p>
                </button>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => openEditModal(i)} className="rounded-lg p-1.5 text-fresh-600 hover:bg-fresh-50" title="Editar">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => void deleteIngredient(i)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="Excluir">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!items.length && (
            <div className="admin-card border-dashed py-12 text-center text-stone-500">Nenhum ingrediente cadastrado.</div>
          )}
        </div>

        {selected && (
          <div className="admin-card hidden lg:block">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-stone-900">{selected.name}</h2>
              <button type="button" onClick={() => setSelected(null)} className="text-stone-400 hover:text-stone-600">✕</button>
            </div>
            <DetailContent />
          </div>
        )}
      </div>

      {/* Mobile detail sheet */}
      <MobileSheet open={showDetail} onClose={() => setShowDetail(false)} title={selected?.name}>
        <DetailContent />
      </MobileSheet>

      {/* Create modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar ingrediente' : 'Novo ingrediente'}
        subtitle={editingId ? 'Altere os dados básicos do ingrediente.' : 'Cadastre o ingrediente para registrar compras e calcular custos.'}
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary w-full sm:w-auto">Cancelar</button>
            <button type="submit" form="ingrediente-form" disabled={saving} className="admin-btn-primary w-full sm:w-auto disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar ingrediente'}
            </button>
          </div>
        }
      >
        <form id="ingrediente-form" onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextInput label="Nome do ingrediente" required value={form.name} onChange={(name) => setForm({ ...form, name })} />
          </div>
          <SelectInput label="Categoria" value={form.category} onChange={(category) => setForm({ ...form, category })}>
            <option value="fruta">Fruta</option>
            <option value="legume">Legume</option>
            <option value="verdura">Verdura</option>
          </SelectInput>
          <SelectInput label="Unidade de compra" value={form.purchaseUnit} onChange={(purchaseUnit) => setForm({ ...form, purchaseUnit })}>
            <option value="kg">kg</option>
            <option value="unit">unidade</option>
            <option value="caixa">caixa</option>
            <option value="bandeja">bandeja</option>
          </SelectInput>
          <NumberInput label="Estoque mínimo" suffix="kg" step="0.001" min={0} value={form.minStock} onChange={(minStock) => setForm({ ...form, minStock })} />
        </form>
      </Modal>
    </AdminShell>
  );
}
