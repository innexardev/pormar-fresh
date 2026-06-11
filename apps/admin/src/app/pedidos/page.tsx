'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

type Order = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total: number;
  delivery_date: string;
  delivery_label: string;
};

const NEXT: Record<string, string> = {
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

const LABEL: Record<string, string> = {
  pending: 'Aguardando pagamento',
  confirmed: 'Confirmado',
  preparing: 'Cortando',
  ready: 'Pronto',
  out_for_delivery: 'Em rota',
  delivered: 'Entregue',
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(() => {
    if (!token()) { window.location.href = '/'; return; }
    api<Order[]>('/admin/orders?status=active').then(setOrders);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function advance(id: string, status: string) {
    const next = NEXT[status];
    if (!next) return;
    await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
    load();
  }

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold">Pedidos</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.order_id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold">{o.customer_name}</p>
                <p className="text-sm text-gray-500">{o.customer_phone}</p>
                <p className="text-sm">{o.delivery_label} — {o.delivery_date}</p>
                <p className="text-sm font-medium text-fresh-700">{LABEL[o.status] ?? o.status} · R$ {o.total.toFixed(2)}</p>
              </div>
              {NEXT[o.status] && (
                <button onClick={() => advance(o.order_id, o.status)} className="rounded bg-fresh-600 px-4 py-2 text-sm text-white">
                  Avancar
                </button>
              )}
            </div>
          </div>
        ))}
        {!orders.length && <p className="text-gray-500">Nenhum pedido ativo.</p>}
      </div>
    </AdminShell>
  );
}
