'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { ImageUpload } from '@/components/ImageUpload';
import { CategoryFilter } from '@/components/CategoryFilter';
import { CheckboxInput, NumberInput, PriceInput, SelectInput, TextAreaInput, TextInput } from '@/components/FormFields';
import { PageHeaderDesktop } from '@/components/AdminUI';
import { api, token } from '@/lib/api';
import { parseDecimal, UNIT_LABELS } from '@/lib/format';

type Category = { id: string; name: string; slug?: string };
type Product = {
  id: string;
  name: string;
  description?: string | null;
  unitType: string;
  price: string | number;
  stockQty: string | number;
  minStock: string | number;
  active: boolean;
  weightGrams?: number | null;
  imageUrl?: string | null;
  categoryId: string;
  category?: Category;
};

const EMPTY = {
  categoryId: '',
  name: '',
  description: '',
  unitType: 'portion',
  weightGrams: '',
  price: '',
  stockQty: '0',
  minStock: '0',
  active: true,
  imageUrl: '',
};

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCat, setFilterCat] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    api<Product[]>('/admin/products').then(setProducts);
    api<Category[]>('/admin/categories').then(setCategories);
  };

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filterCat !== 'all' && p.categoryId !== filterCat) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, filterCat, search]);

  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    }
    return [
      { id: 'all', label: 'Todos', count: products.length },
      ...categories
        .filter((cat) => counts.has(cat.id))
        .map((cat) => ({ id: cat.id, label: cat.name, count: counts.get(cat.id) ?? 0 })),
    ];
  }, [products, categories]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY, categoryId: categories[0]?.id ?? '' });
    setError('');
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      categoryId: p.categoryId,
      name: p.name,
      description: p.description ?? '',
      unitType: p.unitType,
      weightGrams: p.weightGrams?.toString() ?? '',
      price: String(p.price),
      stockQty: String(p.stockQty),
      minStock: String(p.minStock),
      active: p.active,
      imageUrl: p.imageUrl ?? '',
    });
    setError('');
    setShowModal(true);
  }

  async function toggleActive(p: Product) {
    await api(`/admin/products/${p.id}`, { method: 'PATCH', body: JSON.stringify({ active: !p.active }) });
    load();
  }

  async function deleteProduct(p: Product) {
    if (!confirm(`Excluir "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api(`/admin/products/${p.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir produto');
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const price = parseDecimal(form.price);
      if (price === null) throw new Error('Informe um preço válido');
      const payload = {
        categoryId: form.categoryId,
        name: form.name,
        description: form.description || undefined,
        unitType: form.unitType,
        weightGrams: form.weightGrams ? Number(form.weightGrams) : undefined,
        price,
        stockQty: Number(form.stockQty),
        minStock: Number(form.minStock),
        active: form.active,
        imageUrl: form.imageUrl || null,
      };
      if (editingId) {
        await api(`/admin/products/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const statusBadge = (active: boolean) => (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${active ? 'bg-fresh-100 text-fresh-800' : 'bg-stone-100 text-stone-500'}`}>
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Produtos"
        description="Gerencie o catálogo de produtos e estoque."
        action={
          <button type="button" onClick={openCreate} className="admin-btn-primary">
            + Novo produto
          </button>
        }
      />

      <div className="mb-4 flex items-center justify-between xl:hidden">
        <p className="text-sm text-stone-500">{filtered.length} produto(s)</p>
        <button type="button" onClick={openCreate} className="admin-btn-primary text-sm">
          + Novo produto
        </button>
      </div>

      <CategoryFilter tabs={tabs} active={filterCat} onChange={setFilterCat} search={search} onSearchChange={setSearch} />

      {/* Mobile: cards */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:hidden">
        {filtered.map((p) => (
          <div key={p.id} className="admin-card flex gap-4">
            {p.imageUrl && (
              <img
                src={p.imageUrl}
                alt={p.name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-stone-900 leading-snug">{p.name}</p>
                {statusBadge(p.active)}
              </div>
              <p className="mt-0.5 text-xs text-stone-500">{p.category?.name} · {UNIT_LABELS[p.unitType] ?? p.unitType}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-bold text-fresh-700">R$ {Number(p.price).toFixed(2).replace('.', ',')}</p>
                <p className="text-xs text-stone-500">Estoque: {Number(p.stockQty)}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button
                type="button"
                onClick={() => openEdit(p)}
                aria-label={`Editar ${p.name}`}
                className="flex items-center justify-center rounded-lg p-1.5 text-fresh-600 hover:bg-fresh-50"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => void toggleActive(p)}
                aria-label={p.active ? 'Desativar' : 'Ativar'}
                className={`flex items-center justify-center rounded-lg p-1.5 text-xs ${p.active ? 'text-amber-600 hover:bg-amber-50' : 'text-fresh-600 hover:bg-fresh-50'}`}
              >
                {p.active ? '⏸' : '▶'}
              </button>
              <button
                type="button"
                onClick={() => void deleteProduct(p)}
                aria-label={`Excluir ${p.name}`}
                className="flex items-center justify-center rounded-lg p-1.5 text-red-500 hover:bg-red-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="admin-card col-span-2 border-dashed py-12 text-center text-stone-500">
            Nenhum produto nesta categoria.
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="mt-4 hidden lg:block admin-card p-0 overflow-hidden">
        <div className="admin-table-wrap px-0">
          <table className="admin-table min-w-[640px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Unidade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Preço</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Estoque</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 transition hover:bg-stone-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.name} className="h-9 w-9 rounded-lg object-cover" />
                      )}
                      <span className="font-medium text-stone-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-stone-600">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3.5 text-stone-600">{UNIT_LABELS[p.unitType] ?? p.unitType}</td>
                  <td className="px-4 py-3.5 font-semibold text-fresh-700">R$ {Number(p.price).toFixed(2).replace('.', ',')}</td>
                  <td className="px-4 py-3.5 text-stone-600">{Number(p.stockQty)}</td>
                  <td className="px-4 py-3.5">{statusBadge(p.active)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => openEdit(p)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-fresh-700 hover:bg-fresh-50">
                        Editar
                      </button>
                      <button type="button" onClick={() => void toggleActive(p)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${p.active ? 'text-amber-600 hover:bg-amber-50' : 'text-fresh-600 hover:bg-fresh-50'}`}>
                        {p.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button type="button" onClick={() => void deleteProduct(p)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-stone-500">Nenhum produto nesta categoria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar produto' : 'Novo produto'}
        subtitle={editingId ? 'Altere os dados e salve.' : 'Preencha os dados do novo produto.'}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="admin-btn-secondary w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={saving}
              className="admin-btn-primary w-full sm:w-auto disabled:opacity-50"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar produto'}
            </button>
          </div>
        }
      >
        <form id="product-form" onSubmit={save} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Nome do produto" required value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <SelectInput label="Categoria" required value={form.categoryId} onChange={(categoryId) => setForm({ ...form, categoryId })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectInput>
            <SelectInput label="Unidade de venda" value={form.unitType} onChange={(unitType) => setForm({ ...form, unitType })}>
              <option value="portion">Porção</option>
              <option value="kg">Kg</option>
              <option value="g">Gramas</option>
              <option value="unit">Unidade</option>
            </SelectInput>
            <NumberInput label="Peso por unidade (g)" hint="Ex: 250" suffix="g" min={0} value={form.weightGrams} onChange={(weightGrams) => setForm({ ...form, weightGrams })} />
            <PriceInput label="Preço de venda" required value={form.price} onChange={(price) => setForm({ ...form, price })} />
            <NumberInput label="Estoque atual" step="0.001" min={0} value={form.stockQty} onChange={(stockQty) => setForm({ ...form, stockQty })} />
            <NumberInput label="Estoque mínimo" hint="Alerta abaixo deste valor" step="0.001" min={0} value={form.minStock} onChange={(minStock) => setForm({ ...form, minStock })} />
          </div>
          <ImageUpload folder="products" label="Imagem do produto" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
          <TextAreaInput label="Descrição" hint="Ex: 250g — cortado no dia" rows={2} value={form.description} onChange={(description) => setForm({ ...form, description })} />
          <CheckboxInput label="Ativo no cardápio" checked={form.active} onChange={(active) => setForm({ ...form, active })} />
        </form>
      </Modal>
    </AdminShell>
  );
}
