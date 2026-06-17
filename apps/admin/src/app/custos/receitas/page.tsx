'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { NumberInput, SelectInput, TextInput } from '@/components/FormFields';
import { PageHeaderDesktop } from '@/components/AdminUI';
import { api, token } from '@/lib/api';

type Ingredient = { id: string; name: string; costPerKgNet: string };
type Packaging = { id: string; name: string; unitCost: string };
type Recipe = {
  id: string;
  name: string;
  computedCost: string;
  suggestedPrice: string;
  targetMarginPercent: string;
  items: Array<{ id: string; quantityGrams: number; ingredient: { id: string; name: string; costPerKgNet: string } }>;
  packaging: Packaging | null;
  product: { name: string } | null;
  combo: { name: string } | null;
};

type SimResult = {
  totalCost: string;
  suggestedPrice: string;
  marginPercent: string;
  netProfit: string;
  ingredientsCost: string;
  packagingCost: string;
  breakdown: Array<{ ingredient: string; quantity_grams: number; line_cost: string }>;
  margin_suggestions: { safe_price: string; ideal_price: string; premium_price: string };
};

function fmt(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ReceitasPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [sim, setSim] = useState<SimResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', packagingId: '', targetMarginPercent: '120',
    items: [{ ingredientId: '', quantityGrams: '' }],
  });

  const load = async () => {
    const [r, i, p] = await Promise.all([
      api<Recipe[]>('/admin/pricing/recipes'),
      api<Ingredient[]>('/admin/pricing/ingredients'),
      api<Packaging[]>('/admin/pricing/packaging'),
    ]);
    setRecipes(r);
    setIngredients(i);
    setPackaging(p);
  };

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: '', packagingId: '', targetMarginPercent: '120', items: [{ ingredientId: '', quantityGrams: '' }] });
    setShowModal(true);
  }

  function openEditModal(r: Recipe) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      packagingId: r.packaging?.id ?? '',
      targetMarginPercent: String(r.targetMarginPercent),
      items: r.items.length
        ? r.items.map((i) => ({ ingredientId: i.ingredient.id, quantityGrams: String(i.quantityGrams) }))
        : [{ ingredientId: '', quantityGrams: '' }],
    });
    setShowModal(true);
  }

  async function deleteRecipe(r: Recipe) {
    if (!confirm(`Excluir receita "${r.name}"?`)) return;
    try {
      await api(`/admin/pricing/recipes/${r.id}`, { method: 'DELETE' });
      if (selected?.id === r.id) { setSelected(null); setSim(null); }
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir receita');
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        packagingId: form.packagingId || undefined,
        targetMarginPercent: Number(form.targetMarginPercent),
        items: form.items
          .filter((i) => i.ingredientId && i.quantityGrams)
          .map((i) => ({ ingredientId: i.ingredientId, quantityGrams: Number(i.quantityGrams) })),
      };
      if (editingId) {
        await api(`/admin/pricing/recipes/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/admin/pricing/recipes', { method: 'POST', body: JSON.stringify(payload) });
      }
      setForm({ name: '', packagingId: '', targetMarginPercent: '120', items: [{ ingredientId: '', quantityGrams: '' }] });
      setShowModal(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function runSimulate(recipe: Recipe) {
    setSelected(recipe);
    const result = await api<SimResult>(`/admin/pricing/recipes/${recipe.id}/simulate`, { method: 'POST', body: '{}' });
    setSim(result);
  }

  async function applyPrice(id: string) {
    await api(`/admin/pricing/recipes/${id}/apply-price`, { method: 'POST', body: '{}' });
    alert('Preço aplicado ao produto/combo vinculado.');
    load();
  }

  function updateItem(idx: number, field: 'ingredientId' | 'quantityGrams', value: string) {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  }

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Receitas & Simulador"
        description="Monte receitas com ingredientes e embalagens e simule preços."
        action={
          <button type="button" onClick={openCreateModal} className="admin-btn-primary">
            + Nova receita
          </button>
        }
      />
      <div className="mb-4 flex items-center justify-between xl:hidden">
        <p className="text-sm text-stone-500">{recipes.length} receita(s)</p>
        <button type="button" onClick={openCreateModal} className="admin-btn-primary text-sm">
          + Nova receita
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {recipes.map((r) => (
            <div key={r.id} className={`admin-card transition ${selected?.id === r.id ? 'ring-2 ring-fresh-300' : ''}`}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">{r.name}</p>
                  {(r.product || r.combo) && (
                    <p className="text-xs text-stone-400">Vinculado: {r.product?.name ?? r.combo?.name}</p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold text-fresh-700">{fmt(r.suggestedPrice)}</p>
                  <p className="text-xs text-stone-500">custo {fmt(r.computedCost)} · {Number(r.targetMarginPercent).toFixed(0)}%</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void runSimulate(r)} className="admin-btn-secondary py-1.5 text-xs">
                  Simular
                </button>
                <button type="button" onClick={() => openEditModal(r)} className="admin-btn-secondary py-1.5 text-xs">
                  Editar
                </button>
                {(r.product || r.combo) && (
                  <button type="button" onClick={() => void applyPrice(r.id)} className="admin-btn-secondary py-1.5 text-xs">
                    Aplicar preço
                  </button>
                )}
                <button type="button" onClick={() => void deleteRecipe(r)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {!recipes.length && (
            <div className="admin-card border-dashed py-12 text-center text-stone-500">Nenhuma receita criada.</div>
          )}
        </div>

        {selected && sim && (
          <div className="admin-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-stone-900">Simulação — {selected.name}</h2>
              <button type="button" onClick={() => { setSelected(null); setSim(null); }} className="text-stone-400 hover:text-stone-600">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Ingredientes</span><span>{fmt(sim.ingredientsCost)}</span></div>
              <div className="flex justify-between"><span>Embalagem</span><span>{fmt(sim.packagingCost)}</span></div>
              <div className="flex justify-between font-semibold border-t border-stone-100 pt-2"><span>Custo total</span><span>{fmt(sim.totalCost)}</span></div>
              <div className="flex justify-between font-bold text-fresh-700"><span>Preço sugerido</span><span>{fmt(sim.suggestedPrice)}</span></div>
              <div className="flex justify-between text-stone-500"><span>Lucro</span><span>{fmt(sim.netProfit)} · {Number(sim.marginPercent).toFixed(0)}%</span></div>
            </div>
            <div className="mt-4 rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
              <p className="mb-1 font-semibold text-stone-700">Sugestões de preço</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-stone-400">Seguro</p><p className="font-bold text-stone-800">{fmt(sim.margin_suggestions.safe_price)}</p></div>
                <div><p className="text-fresh-600">Ideal</p><p className="font-bold text-fresh-700">{fmt(sim.margin_suggestions.ideal_price)}</p></div>
                <div><p className="text-amber-600">Premium</p><p className="font-bold text-amber-700">{fmt(sim.margin_suggestions.premium_price)}</p></div>
              </div>
            </div>
            <h3 className="mt-4 mb-2 text-sm font-semibold text-stone-800">Detalhamento</h3>
            <div className="space-y-1">
              {sim.breakdown.map((b, i) => (
                <div key={i} className="flex justify-between text-xs text-stone-600">
                  <span>{b.ingredient} ({b.quantity_grams}g)</span>
                  <span>{fmt(b.line_cost)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar receita' : 'Nova receita'}
        subtitle="Monte a receita com ingredientes para calcular o custo e preço ideal."
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary w-full sm:w-auto">Cancelar</button>
            <button type="submit" form="receita-form" disabled={saving} className="admin-btn-primary w-full sm:w-auto disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar receita'}
            </button>
          </div>
        }
      >
        <form id="receita-form" onSubmit={onCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput label="Nome da receita" required value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <SelectInput label="Embalagem" value={form.packagingId} onChange={(packagingId) => setForm({ ...form, packagingId })}>
              <option value="">Sem embalagem</option>
              {packaging.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </SelectInput>
            <NumberInput label="Margem desejada" suffix="%" min={0} value={form.targetMarginPercent} onChange={(targetMarginPercent) => setForm({ ...form, targetMarginPercent })} />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-stone-700">Ingredientes</p>
            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid gap-2 rounded-xl border border-stone-100 bg-stone-50/50 p-3 sm:grid-cols-2">
                  <SelectInput label={`Ingrediente ${idx + 1}`} value={item.ingredientId} onChange={(v) => updateItem(idx, 'ingredientId', v)}>
                    <option value="">Selecione</option>
                    {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </SelectInput>
                  <NumberInput label="Quantidade" suffix="g" min={1} value={item.quantityGrams} onChange={(v) => updateItem(idx, 'quantityGrams', v)} />
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-fresh-700 hover:bg-fresh-50"
              onClick={() => setForm({ ...form, items: [...form.items, { ingredientId: '', quantityGrams: '' }] })}
            >
              + Adicionar ingrediente
            </button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
