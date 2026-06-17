'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

type Sub = {
  id: string;
  status: string;
  customer: { name: string; phone: string };
  deliveryWindow: { label: string };
  items: Array<{ itemName: string; quantity: string | number; unitLabel: string }>;
  _count: { orders: number };
  createdAt: string;
};

export default function AssinaturasPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [filter, setFilter] = useState('active');
  const [genResult, setGenResult] = useState<{ created_count: number; skipped_count: number } | null>(null);

  const load = () => {
    const q = filter ? `?status=${filter}` : '';
    api<Sub[]>(`/admin/subscriptions${q}`).then(setSubs);
  };

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, [filter]);

  async function setStatus(id: string, status: 'active' | 'paused' | 'cancelled') {
    await api(`/admin/subscriptions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    load();
  }

  async function generateOrders() {
    if (!confirm('Gerar pedidos da próxima entrega para todas assinaturas ativas?')) return;
    const res = await api<{ created_count: number; skipped_count: number }>('/admin/subscriptions/generate-orders', { method: 'POST' });
    setGenResult(res);
    load();
  }

  const STATUS: Record<string, string> = { active: 'Ativa', paused: 'Pausada', cancelled: 'Cancelada' };
  const STATUS_COLOR: Record<string, string> = {
    active: 'bg-fresh-100 text-fresh-800',
    paused: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-stone-100 text-stone-500',
  };

  return (
    <AdminShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Assinaturas semanais</h1>
          <p className="text-sm text-stone-500">Combo fixo recorrente — gere pedidos antes de cada janela de entrega.</p>
        </div>
        <button type="button" onClick={() => void generateOrders()} className="admin-btn-primary">
          Gerar pedidos da semana
        </button>
      </div>

      {genResult && (
        <div className="mb-5 rounded-xl border border-fresh-200 bg-fresh-50 px-4 py-3 text-sm text-fresh-800">
          {genResult.created_count} pedido(s) criado(s) · {genResult.skipped_count} ignorado(s)
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {['active', 'paused', 'cancelled', ''].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setFilter(s)}
            className={`chip-filter ${filter === s ? 'chip-filter-active' : ''}`}
          >
            {s ? STATUS[s] : 'Todas'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {subs.map((s) => (
          <div key={s.id} className="admin-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-stone-900">{s.customer.name}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[s.status] ?? 'bg-stone-100 text-stone-500'}`}>
                    {STATUS[s.status] ?? s.status}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-stone-500">{s.customer.phone} · {s.deliveryWindow.label}</p>
                <ul className="mt-2 space-y-0.5">
                  {s.items.map((i, idx) => (
                    <li key={idx} className="text-sm text-stone-600">• {i.itemName} × {Number(i.quantity)} {i.unitLabel}</li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-stone-400">{s._count.orders} pedido(s) gerados</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {s.status === 'active' && (
                  <button type="button" onClick={() => void setStatus(s.id, 'paused')} className="admin-btn-secondary py-1.5 text-xs">Pausar</button>
                )}
                {s.status === 'paused' && (
                  <button type="button" onClick={() => void setStatus(s.id, 'active')} className="admin-btn-primary py-1.5 text-xs">Reativar</button>
                )}
                {s.status !== 'cancelled' && (
                  <button type="button" onClick={() => void setStatus(s.id, 'cancelled')} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Cancelar</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {!subs.length && (
          <div className="admin-card border-dashed py-12 text-center text-stone-500">Nenhuma assinatura encontrada.</div>
        )}
      </div>
    </AdminShell>
  );
}
