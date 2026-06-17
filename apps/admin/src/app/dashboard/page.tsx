'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { PageHeader, PageHeaderDesktop, Panel, QuickActionGrid, StatCard } from '@/components/AdminUI';
import { api, token } from '@/lib/api';

type Stats = {
  total_orders: number;
  active_orders: number;
  products: number;
  combos: number;
  revenue_week: number;
  orders_by_delivery: Array<{ date: string; total: number; count: number }>;
};

const QUICK = [
  { href: '/pedidos', label: 'Pedidos', desc: 'Ver ativos', icon: '📦' },
  { href: '/entregas', label: 'Entregas', desc: 'Rotas do dia', icon: '🚚' },
  { href: '/pedidos/separacao', label: 'Separação', desc: 'Lista produção', icon: '📋' },
  { href: '/produtos', label: 'Produtos', desc: 'Catálogo', icon: '🥬' },
  { href: '/clientes', label: 'Clientes', desc: 'Base', icon: '👥' },
  { href: '/suporte', label: 'Suporte', desc: 'WhatsApp', icon: '💬' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    api<Stats>('/admin/dashboard').then(setStats);
  }, []);

  return (
    <AdminShell>
      <PageHeaderDesktop title="Dashboard" description="Resumo da operação — pedidos, receita e catálogo." />
      <PageHeader title="Dashboard" description="Resumo da operação" />

      <QuickActionGrid
        items={QUICK.map((q) => ({
          ...q,
          icon: <span className="text-xl">{q.icon}</span>,
        }))}
      />

      {stats ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Pedidos total" value={stats.total_orders} accent="fresh" />
            <StatCard label="Ativos" value={stats.active_orders} accent="sky" hint="Em andamento" />
            <StatCard label="Receita 7d" value={`R$ ${stats.revenue_week.toFixed(0)}`} accent="amber" />
            <StatCard label="Produtos" value={stats.products} accent="violet" />
            <StatCard label="Combos" value={stats.combos} accent="rose" />
          </div>

          {stats.orders_by_delivery.length > 0 && (
            <Panel title="Pedidos por entrega" className="mt-5 sm:mt-8">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Pedidos</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.orders_by_delivery.map((r) => (
                      <tr key={r.date}>
                        <td className="font-medium text-stone-800">{r.date}</td>
                        <td>{r.count}</td>
                        <td className="font-semibold text-fresh-700">R$ {r.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-2 xl:hidden">
            <Link href="/entregador" className="admin-card flex items-center gap-3 bg-gradient-to-r from-fresh-600 to-emerald-600 text-white">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-semibold">App Entregador</p>
                <p className="text-xs text-white/80">Abrir versão mobile entregas</p>
              </div>
            </Link>
            <Link href="/funcionarios" className="admin-card flex items-center gap-3">
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-semibold text-stone-900">Funcionários</p>
                <p className="text-xs text-stone-500">Gerenciar acesso da equipe</p>
              </div>
            </Link>
          </div>
        </>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="admin-card h-24 animate-pulse bg-stone-100 sm:h-28" />
          ))}
        </div>
      )}
    </AdminShell>
  );
}
