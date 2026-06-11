'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

type Dashboard = {
  ingredients_count: number;
  recipes_count: number;
  avg_margin_percent: string;
  total_recipe_cost: string;
  total_suggested_revenue: string;
  top_profitable: Array<{ id: string; name: string; total_cost: string; suggested_price: string; margin_percent: string; net_profit: string }>;
  least_profitable: Array<{ id: string; name: string; margin_percent: string; net_profit: string }>;
  alerts: Array<{ id: string; type: string; message: string; createdAt: string }>;
};

function fmt(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CustosDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    api<Dashboard>('/admin/pricing/dashboard').then(setData).catch(console.error);
  }, []);

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custos & Preços</h1>
          <p className="text-sm text-gray-500">Pomar Fresh — margem, custo líquido e precificação</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/custos/ingredientes" className="rounded bg-fresh-600 px-3 py-2 text-sm text-white">Ingredientes</Link>
          <Link href="/custos/producao" className="rounded border px-3 py-2 text-sm">Produção</Link>
          <Link href="/custos/relatorios" className="rounded border px-3 py-2 text-sm">Relatórios</Link>
          <Link href="/custos/alertas" className="rounded border px-3 py-2 text-sm">Alertas</Link>
        </div>
      </div>

      {!data ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Ingredientes" value={String(data.ingredients_count)} />
            <StatCard label="Receitas" value={String(data.recipes_count)} />
            <StatCard label="Margem média" value={`${Number(data.avg_margin_percent).toFixed(1)}%`} />
            <StatCard label="Custo total receitas" value={fmt(data.total_recipe_cost)} />
          </div>

          {data.alerts.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 font-semibold text-amber-700">Alertas</h2>
              <div className="space-y-2">
                {data.alerts.map((a) => (
                  <div key={a.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                    {a.message}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 font-semibold text-green-700">Mais lucrativos</h2>
              <div className="space-y-2">
                {data.top_profitable.map((r) => (
                  <div key={r.id} className="rounded-lg bg-white p-3 text-sm shadow-sm">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-gray-600">Custo {fmt(r.total_cost)} → {fmt(r.suggested_price)} · lucro {fmt(r.net_profit)}</p>
                  </div>
                ))}
                {data.top_profitable.length === 0 && <p className="text-sm text-gray-500">Nenhuma receita cadastrada.</p>}
              </div>
            </section>
            <section>
              <h2 className="mb-3 font-semibold text-red-700">Menos lucrativos</h2>
              <div className="space-y-2">
                {data.least_profitable.map((r) => (
                  <div key={r.id} className="rounded-lg bg-white p-3 text-sm shadow-sm">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-gray-600">Margem {Number(r.margin_percent).toFixed(1)}% · lucro {fmt(r.net_profit)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-fresh-700">{value}</p>
    </div>
  );
}
