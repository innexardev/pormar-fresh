'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { ImageUpload } from '@/components/ImageUpload';
import { CategoryFilter } from '@/components/CategoryFilter';
import { CheckboxInput, NumberInput, PriceInput, SelectInput, TextAreaInput, TextInput } from '@/components/FormFields';
import { PageHeaderDesktop } from '@/components/AdminUI';
import { api, token } from '@/lib/api';
import { parseDecimal } from '@/lib/format';

type Category = { id: string; name: string; slug: string };
type ComboItem = { itemName: string; quantity: string; unitLabel: string };
type Combo = {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  weightLabel?: string | null;
  servesPeople?: number | null;
  active: boolean;
  featured: boolean;
  imageUrl?: string | null;
  categoryId?: string | null;
  category?: Category | null;
  items: Array<{ itemName: string; quantity: string | number; unitLabel: string }>;
};

const EMPTY_ITEM: ComboItem = { itemName: '', quantity: '1', unitLabel: 'g' };
const EMPTY = {
  name: '',
  description: '',
  price: '',
  weightLabel: '',
  servesPeople: '',
  featured: false,
  active: true,
  imageUrl: '',
  items: [{ ...EMPTY_ITEM }] as ComboItem[],
};

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCat, setFilterCat] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    api<Combo[]>('/admin/combos').then(setCombos);
    api<Category[]>('/admin/categories').then(setCategories);
  };

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY, items: [{ ...EMPTY_ITEM }] });
    setShowModal(true);
    setError('');
  }

  function openEdit(c: Combo) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      description: c.description ?? '',
      price: String(c.price),
      weightLabel: c.weightLabel ?? '',
      servesPeople: c.servesPeople?.toString() ?? '',
      featured: c.featured,
      active: c.active,
      imageUrl: c.imageUrl ?? '',
      items: c.items.length
        ? c.items.map((i) => ({ itemName: i.itemName, quantity: String(i.quantity), unitLabel: i.unitLabel }))
        : [{ ...EMPTY_ITEM }],
    });
    setShowModal(true);
    setError('');
  }

  function updateItem(idx: number, field: keyof ComboItem, value: string) {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return combos.filter((c) => {
      if (filterCat !== 'all' && c.category?.slug !== filterCat) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [combos, filterCat, search]);

  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of combos) {
      const slug = c.category?.slug ?? 'sem-categoria';
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    return [
      { id: 'all', label: 'Todos', count: combos.length },
      ...categories
        .filter((cat) => counts.has(cat.slug))
        .map((cat) => ({ id: cat.slug, label: cat.name, count: counts.get(cat.slug) ?? 0 })),
    ];
  }, [combos, categories]);

  async function toggleActive(c: Combo) {
    await api(`/admin/combos/${c.id}`, { method: 'PATCH', body: JSON.stringify({ active: !c.active }) });
    load();
  }

  async function deleteCombo(c: Combo) {
    if (!confirm(`Excluir "${c.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api(`/admin/combos/${c.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir combo');
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const items = form.items.filter((i) => i.itemName.trim());
    if (!items.length) {
      setError('Adicione pelo menos um item ao combo');
      setSaving(false);
      return;
    }
    try {
      const price = parseDecimal(form.price);
      if (price === null) throw new Error('Informe um preço válido');
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price,
        weightLabel: form.weightLabel || undefined,
        servesPeople: form.servesPeople ? Number(form.servesPeople) : undefined,
        featured: form.featured,
        active: form.active,
        imageUrl: form.imageUrl || null,
        items: items.map((i) => ({
          itemName: i.itemName,
          quantity: Number(i.quantity),
          unitLabel: i.unitLabel,
        })),
      };
      if (editingId) {
        await api(`/admin/combos/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/admin/combos', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Combos"
        description="Gerencie os combos e cestas do cardápio."
        action={
          <button type="button" onClick={openCreate} className="admin-btn-primary">
            + Novo combo
          </button>
        }
      />

      <div className="mb-4 flex items-center justify-between xl:hidden">
        <p className="text-sm text-stone-500">{filtered.length} combo(s)</p>
        <button type="button" onClick={openCreate} className="admin-btn-primary text-sm">
          + Novo combo
        </button>
      </div>

      <CategoryFilter tabs={tabs} active={filterCat} onChange={setFilterCat} search={search} onSearchChange={setSearch} />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <div key={c.id} className="admin-card">
            {c.imageUrl && (
              <img src={c.imageUrl} alt={c.name} className="mb-3 h-40 w-full rounded-xl object-cover" />
            )}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display font-bold text-stone-900 leading-snug">{c.name}</h3>
                {c.category && <p className="text-xs text-stone-400">{c.category.name}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                {c.featured && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">Destaque</span>}
                {!c.active && <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-500">Inativo</span>}
              </div>
            </div>
            {c.weightLabel && <p className="mt-1 text-sm text-stone-500">{c.weightLabel}</p>}
            <ul className="my-3 space-y-0.5 text-sm text-stone-600">
              {c.items.map((i, idx) => (
                <li key={idx}>· {i.itemName} — {Number(i.quantity)}{i.unitLabel}</li>
              ))}
            </ul>
            <div className="flex items-center justify-between pt-1">
              <p className="font-bold text-fresh-700">R$ {Number(c.price).toFixed(2).replace('.', ',')}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void toggleActive(c)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${c.active ? 'text-amber-600 hover:bg-amber-50' : 'text-fresh-600 hover:bg-fresh-50'}`}
                >
                  {c.active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-fresh-700 hover:bg-fresh-50"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void deleteCombo(c)}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="admin-card col-span-full border-dashed py-12 text-center text-stone-500">
            Nenhum combo nesta categoria.
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar combo' : 'Novo combo'}
        subtitle={editingId ? 'Altere os dados e salve.' : 'Preencha os dados do novo combo.'}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary w-full sm:w-auto">
              Cancelar
            </button>
            <button
              type="submit"
              form="combo-form"
              disabled={saving}
              className="admin-btn-primary w-full sm:w-auto disabled:opacity-50"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar combo'}
            </button>
          </div>
        }
      >
        <form id="combo-form" onSubmit={save} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Nome do combo" required value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <PriceInput label="Preço de venda" required value={form.price} onChange={(price) => setForm({ ...form, price })} />
            <TextInput label="Peso total" hint="Ex: ~1,2 kg" value={form.weightLabel} onChange={(weightLabel) => setForm({ ...form, weightLabel })} />
            <NumberInput label="Serve quantas pessoas" min={1} value={form.servesPeople} onChange={(servesPeople) => setForm({ ...form, servesPeople })} />
          </div>
          <ImageUpload folder="combos" label="Imagem do combo" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
          <TextAreaInput label="Descrição" rows={2} value={form.description} onChange={(description) => setForm({ ...form, description })} />
          <div className="flex gap-4">
            <CheckboxInput label="Destaque no cardápio" checked={form.featured} onChange={(featured) => setForm({ ...form, featured })} />
            <CheckboxInput label="Ativo no cardápio" checked={form.active} onChange={(active) => setForm({ ...form, active })} />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-stone-700">Itens do combo</p>
            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid gap-2 rounded-xl border border-stone-100 bg-stone-50/50 p-3 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <TextInput label={`Item ${idx + 1}`} required value={item.itemName} onChange={(v) => updateItem(idx, 'itemName', v)} />
                  </div>
                  <NumberInput label="Qtd" required step="0.001" min={0} value={item.quantity} onChange={(v) => updateItem(idx, 'quantity', v)} />
                  <SelectInput label="Unidade" value={item.unitLabel} onChange={(v) => updateItem(idx, 'unitLabel', v)}>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="un">un</option>
                  </SelectInput>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] })}
              className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-fresh-700 hover:bg-fresh-50"
            >
              + Adicionar item
            </button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
