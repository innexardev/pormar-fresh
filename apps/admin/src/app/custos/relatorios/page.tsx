'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

type Report = {
  period_weeks: number;
  summary: {
    revenue: string;
    order_count: number;
    avg_margin_percent: string;
    avg_weekly_purchase_cost: number;
    active_ingredients: number;
    active_recipes: number;
  };
  most_profitable: Array<{ name: string; net_profit: string; margin_percent: string; price: string; cost: string }>;
  least_profitable: Array<{ name: string; net_profit: string; margin_percent: string }>;
  waste_by_ingredient: Array<{ name: string; waste_kg: number; waste_percent: number; records: number }>;
  weekly_purchase_costs: Array<{ week: string; total: number }>;
  price_evolution: Array<{ ingredient: string; points: Array<{ date: string; cost_per_kg: number }> }>;
  sales_ranking: Array<{ name: string; quantity: number; revenue: number }>;
  low_stock_ingredients: Array<{ name: string; stock_net_kg: string; min_stock_kg: string }>;
};

function fmt(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function RelatoriosPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [weeks, setWeeks] = useState(8);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    api<Report>(`/admin/pricing/reports?weeks=${weeks}`).then(setReport).catch(console.error);
  }, [weeks]);

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-gray-500">Lucro, desperdício, custos e vendas</p>
        </div>
        <select className="rounded border px-3 py-2 text-sm" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
          <option value={4}>4 semanas</option>
          <option value={8}>8 semanas</option>
          <option value={12}>12 semanas</option>
        </select>
      </div>

      {!report ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Faturamento" value={fmt(report.summary.revenue)} />
            <Stat label="Pedidos" value={String(report.summary.order_count)} />
            <Stat label="Margem média" value={`${Number(report.summary.avg_margin_percent).toFixed(1)}%`} />
            <Stat label="Custo compras/semana" value={fmt(report.summary.avg_weekly_purchase_cost)} />
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <Section title="Ranking de vendas">
              {report.sales_ranking.map((s) => (
                <Row key={s.name} left={s.name} right={`${s.quantity} un · ${fmt(s.revenue)}`} />
              ))}
              {report.sales_ranking.length === 0 && <Empty />}
            </Section>

            <Section title="Mais lucrativos">
              {report.most_profitable.slice(0, 8).map((r) => (
                <Row key={r.name} left={r.name} right={`${fmt(r.net_profit)} · ${Number(r.margin_percent).toFixed(0)}%`} />
              ))}
            </Section>

            <Section title="Desperdício por ingrediente">
              {report.waste_by_ingredient.map((w) => (
                <Row key={w.name} left={w.name} right={`${w.waste_kg} kg (${w.waste_percent}%)`} />
              ))}
              {report.waste_by_ingredient.length === 0 && <Empty />}
            </Section>

            <Section title="Estoque crítico (ingredientes)">
              {report.low_stock_ingredients.map((i) => (
                <Row key={i.name} left={i.name} right={`${Number(i.stock_net_kg).toFixed(2)} / min ${Number(i.min_stock_kg).toFixed(2)} kg`} />
              ))}
              {report.low_stock_ingredients.length === 0 && <p className="text-sm text-gray-500">Nenhum alerta de estoque.</p>}
            </Section>
          </div>

          <Section title="Custo médio por semana (compras)">
            <div className="flex flex-wrap gap-2">
              {report.weekly_purchase_costs.map((w) => (
                <span key={w.week} className="rounded bg-white px-3 py-2 text-sm shadow-sm">
                  {w.week}: {fmt(w.total)}
                </span>
              ))}
            </div>
          </Section>

          <div className="mt-8">
            <h2 className="mb-3 font-semibold">Evolução do preço (R$/kg líquido)</h2>
            <div className="space-y-4">
              {report.price_evolution.map((pe) => (
                <div key={pe.ingredient} className="rounded-lg bg-white p-3 text-sm shadow-sm">
                  <p className="mb-2 font-medium">{pe.ingredient}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {pe.points.map((p) => (
                      <span key={p.date}>{p.date}: R$ {p.cost_per_kg.toFixed(2)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-fresh-700">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex justify-between rounded bg-white px-3 py-2 text-sm shadow-sm">
      <span>{left}</span>
      <span className="text-gray-600">{right}</span>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-gray-500">Sem dados no período.</p>;
}
