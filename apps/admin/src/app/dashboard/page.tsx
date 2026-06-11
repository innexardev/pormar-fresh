'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<{ total_orders: number; active_orders: number; products: number; combos: number } | null>(null);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    api<typeof stats>('/admin/dashboard').then(setStats);
  }, []);

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['Pedidos total', stats.total_orders],
            ['Pedidos ativos', stats.active_orders],
            ['Produtos', stats.products],
            ['Combos', stats.combos],
          ].map(([label, val]) => (
            <div key={String(label)} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-3xl font-bold">{val}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-8 text-sm text-gray-600">
        Entregas: terca e sexta · Estoque baixa ao confirmar pagamento do pedido.
      </p>
    </AdminShell>
  );
}
