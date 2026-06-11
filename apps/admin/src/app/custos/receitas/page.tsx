'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    await api('/admin/pricing/recipes', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        packagingId: form.packagingId || undefined,
        targetMarginPercent: Number(form.targetMarginPercent),
        items: form.items
          .filter((i) => i.ingredientId && i.quantityGrams)
          .map((i) => ({ ingredientId: i.ingredientId, quantityGrams: Number(i.quantityGrams) })),
      }),
    });
    setForm({ name: '', packagingId: '', targetMarginPercent: '120', items: [{ ingredientId: '', quantityGrams: '' }] });
    load();
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

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold">Receitas & Simulador</h1>

      <form onSubmit={onCreate} className="mb-8 rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <input className="rounded border px-3 py-2 text-sm" placeholder="Nome da receita" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select className="rounded border px-3 py-2 text-sm" value={form.packagingId} onChange={(e) => setForm({ ...form, packagingId: e.target.value })}>
            <option value="">Embalagem</option>
            {packaging.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input className="w-28 rounded border px-3 py-2 text-sm" placeholder="Lucro %" value={form.targetMarginPercent} onChange={(e) => setForm({ ...form, targetMarginPercent: e.target.value })} />
        </div>
        {form.items.map((item, idx) => (
          <div key={idx} className="mb-2 flex gap-2">
            <select className="flex-1 rounded border px-3 py-2 text-sm" value={item.ingredientId} onChange={(e) => {
              const items = [...form.items]; items[idx] = { ...items[idx], ingredientId: e.target.value }; setForm({ ...form, items });
            }}>
              <option value="">Ingrediente</option>
              {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <input className="w-32 rounded border px-3 py-2 text-sm" placeholder="Gramas" value={item.quantityGrams} onChange={(e) => {
              const items = [...form.items]; items[idx] = { ...items[idx], quantityGrams: e.target.value }; setForm({ ...form, items });
            }} />
          </div>
        ))}
        <div className="mt-3 flex gap-2">
          <button type="button" className="text-sm text-fresh-600" onClick={() => setForm({ ...form, items: [...form.items, { ingredientId: '', quantityGrams: '' }] })}>+ item</button>
          <button type="submit" className="rounded bg-fresh-600 px-4 py-2 text-sm text-white">Criar receita</button>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          {recipes.map((r) => (
            <div key={r.id} className="rounded-lg bg-white p-3 text-sm shadow-sm">
              <p className="font-medium">{r.name}</p>
              <p className="text-gray-600">Custo {fmt(r.computedCost)} → {fmt(r.suggestedPrice)} (margem {Number(r.targetMarginPercent).toFixed(0)}%)</p>
              {(r.product || r.combo) && <p className="text-xs text-gray-400">Vinculado: {r.product?.name ?? r.combo?.name}</p>}
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => runSimulate(r)} className="text-fresh-600">Simular</button>
                {(r.product || r.combo) && (
                  <button type="button" onClick={() => applyPrice(r.id)} className="text-gray-600">Aplicar preço</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {selected && sim && (
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Simulação — {selected.name}</h2>
            <p className="mb-1">Ingredientes: {fmt(sim.ingredientsCost)}</p>
            <p className="mb-1">Embalagem: {fmt(sim.packagingCost)}</p>
            <p className="mb-1 font-medium">Custo total: {fmt(sim.totalCost)}</p>
            <p className="mb-3 font-medium text-fresh-700">Preço sugerido: {fmt(sim.suggestedPrice)} · lucro {fmt(sim.netProfit)}</p>
            <p className="mb-2 text-xs text-gray-500">
              Margens sugeridas: segura {fmt(sim.margin_suggestions.safe_price)} · ideal {fmt(sim.margin_suggestions.ideal_price)} · premium {fmt(sim.margin_suggestions.premium_price)}
            </p>
            <ul className="space-y-1 text-xs text-gray-600">
              {sim.breakdown.map((b, i) => (
                <li key={i}>{b.ingredient}: {b.quantity_grams}g = {fmt(b.line_cost)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
