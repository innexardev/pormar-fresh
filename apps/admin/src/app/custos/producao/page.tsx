'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

type Slot = {
  delivery_window_id: string;
  delivery_label: string;
  delivery_date: string;
  cutoff_at: string;
  cutoff_passed: boolean;
  orders_count: number;
  plan_id: string | null;
  plan_status: string | null;
};

type PlanDetail = {
  id: string;
  delivery_date: string;
  delivery_label: string;
  status: string;
  orders_count: number;
  cutoff_at: string;
  warnings: string[];
  outputs: Array<{ item_name: string; quantity: number }>;
  shopping_list: Array<{
    name: string;
    category: string;
    net_kg_needed: number;
    gross_kg_needed: number;
    purchase_kg: number;
    yield_percent: string;
  }>;
  packaging: Array<{ name: string; size_label: string; quantity: number }>;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ProducaoPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSlots = () => api<Slot[]>('/admin/production/upcoming').then(setSlots);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    loadSlots();
  }, []);

  async function generate(slot: Slot) {
    setLoading(true);
    try {
      const result = await api<PlanDetail>('/admin/production/generate', {
        method: 'POST',
        body: JSON.stringify({
          delivery_window_id: slot.delivery_window_id,
          delivery_date: slot.delivery_date,
        }),
      });
      setPlan(result);
      loadSlots();
    } finally {
      setLoading(false);
    }
  }

  async function openPlan(id: string) {
    setLoading(true);
    try {
      const result = await api<PlanDetail>(`/admin/production/plans/${id}`);
      setPlan(result);
    } finally {
      setLoading(false);
    }
  }

  async function finalize() {
    if (!plan) return;
    await api(`/admin/production/plans/${plan.id}/finalize`, { method: 'PATCH' });
    openPlan(plan.id);
    loadSlots();
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Plano de Produção</h1>
        <p className="text-sm text-gray-500">
          Após o cutoff (seg/qui 18h), gere a lista de compras e o que produzir para a entrega.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-semibold">Próximas entregas</h2>
        <div className="space-y-2">
          {slots.map((s) => (
            <div key={`${s.delivery_window_id}-${s.delivery_date}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm shadow-sm">
              <div>
                <p className="font-medium">{s.delivery_label} — {fmtDate(s.delivery_date)}</p>
                <p className="text-gray-500">
                  Cutoff: {fmtDateTime(s.cutoff_at)}
                  {s.cutoff_passed ? ' · fechado' : ' · aberto'}
                  {' · '}{s.orders_count} pedido(s)
                </p>
              </div>
              <div className="flex gap-2">
                {s.plan_id ? (
                  <>
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs">{s.plan_status}</span>
                    <button type="button" onClick={() => openPlan(s.plan_id!)} className="text-fresh-600">Ver plano</button>
                    <button type="button" disabled={loading} onClick={() => generate(s)} className="text-gray-500">Recalcular</button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={loading || s.orders_count === 0}
                    onClick={() => generate(s)}
                    className="rounded bg-fresh-600 px-3 py-1 text-white disabled:opacity-40"
                  >
                    Gerar plano
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {plan && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">
                {plan.delivery_label} — {fmtDate(plan.delivery_date)}
              </h2>
              <p className="text-sm text-gray-500">
                {plan.orders_count} pedidos · status {plan.status}
              </p>
            </div>
            {plan.status === 'draft' && (
              <button type="button" onClick={finalize} className="rounded border px-3 py-1 text-sm">
                Finalizar plano
              </button>
            )}
          </div>

          {plan.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              {plan.warnings.map((w, i) => <p key={i}>{w}</p>)}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold text-green-700">Lista de compras (bruto)</h3>
              <div className="space-y-2">
                {plan.shopping_list.filter((i) => i.purchase_kg > 0).map((i) => (
                  <div key={i.name} className="rounded-lg bg-white p-3 text-sm shadow-sm">
                    <p className="font-medium">{i.name} <span className="text-gray-400">({i.category})</span></p>
                    <p className="text-fresh-700">Comprar: <strong>{i.purchase_kg.toFixed(2)} kg</strong> bruto</p>
                    <p className="text-xs text-gray-500">
                      Necessário {i.net_kg_needed.toFixed(2)} kg líquido · rendimento {Number(i.yield_percent).toFixed(0)}%
                    </p>
                  </div>
                ))}
                {plan.shopping_list.every((i) => i.purchase_kg <= 0) && (
                  <p className="text-sm text-gray-500">Estoque cobre toda a demanda.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Produzir</h3>
              <div className="mb-4 space-y-1">
                {plan.outputs.map((o, i) => (
                  <div key={i} className="rounded-lg bg-white p-2 text-sm shadow-sm">
                    {o.quantity}× {o.item_name}
                  </div>
                ))}
              </div>

              {plan.packaging.length > 0 && (
                <>
                  <h3 className="mb-2 font-semibold">Embalagens</h3>
                  <div className="space-y-1">
                    {plan.packaging.map((p, i) => (
                      <div key={i} className="rounded-lg bg-white p-2 text-sm shadow-sm">
                        {p.quantity}× {p.name} ({p.size_label})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <Link href="/custos" className="text-sm text-fresh-600">← Voltar ao dashboard de custos</Link>
        </section>
      )}
    </AdminShell>
  );
}
