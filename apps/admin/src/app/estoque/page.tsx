'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

export default function EstoquePage() {
  const [low, setLow] = useState<Array<{ id: string; name: string; stock_qty: number; min_stock: number }>>([]);
  const [movements, setMovements] = useState<Array<{ id: string; type: string; quantity: string; reason?: string; product: { name: string }; createdAt: string }>>([]);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    api<typeof low>('/admin/stock/low').then(setLow);
    api<typeof movements>('/admin/stock/movements').then(setMovements);
  }, []);

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold">Estoque</h1>

      <h2 className="mb-3 font-semibold text-amber-700">Estoque baixo</h2>
      {low.length === 0 ? (
        <p className="mb-8 text-sm text-gray-500">Nenhum produto abaixo do minimo.</p>
      ) : (
        <div className="mb-8 space-y-2">
          {low.map((p) => (
            <div key={p.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              {p.name} — {p.stock_qty} / min {p.min_stock}
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 font-semibold">Ultimas movimentacoes</h2>
      <div className="space-y-2">
        {movements.map((m) => (
          <div key={m.id} className="rounded-lg bg-white p-3 text-sm shadow-sm">
            <span className="font-medium">{m.product.name}</span> — {m.type} {Number(m.quantity)} {m.reason && `(${m.reason})`}
            <span className="float-right text-gray-400">{new Date(m.createdAt).toLocaleString('pt-BR')}</span>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
