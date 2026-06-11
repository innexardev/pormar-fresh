'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

type Alert = {
  id: string;
  type: string;
  message: string;
  entityType: string | null;
  createdAt: string;
  read: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  low_margin: 'Margem baixa',
  below_ideal_margin: 'Abaixo do ideal',
  no_profit: 'Sem lucro',
  high_cost: 'Custo alto',
  high_waste: 'Desperdício',
  expiry_soon: 'Validade',
  low_stock: 'Estoque',
};

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scanning, setScanning] = useState(false);

  const load = () => api<Alert[]>('/admin/pricing/alerts?all=true').then(setAlerts);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  async function scan() {
    setScanning(true);
    try {
      await api('/admin/pricing/alerts/scan', { method: 'POST', body: '{}' });
      await load();
    } finally {
      setScanning(false);
    }
  }

  async function markRead(id: string) {
    await api(`/admin/pricing/alerts/${id}/read`, { method: 'PATCH' });
    load();
  }

  async function markAllRead() {
    await api('/admin/pricing/alerts/read-all', { method: 'PATCH' });
    load();
  }

  const unread = alerts.filter((a) => !a.read);

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Alertas</h1>
          <p className="text-sm text-gray-500">{unread.length} não lidos</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={scan} disabled={scanning} className="rounded bg-fresh-600 px-3 py-2 text-sm text-white disabled:opacity-50">
            {scanning ? 'Analisando...' : 'Verificar agora'}
          </button>
          <button type="button" onClick={markAllRead} className="rounded border px-3 py-2 text-sm">Marcar todos lidos</button>
        </div>
      </div>

      <div className="space-y-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`rounded-lg p-3 text-sm shadow-sm ${a.read ? 'bg-gray-50 text-gray-500' : 'border border-amber-200 bg-amber-50'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="mr-2 rounded bg-white px-2 py-0.5 text-xs font-medium">{TYPE_LABEL[a.type] ?? a.type}</span>
                <span>{a.message}</span>
              </div>
              {!a.read && (
                <button type="button" onClick={() => markRead(a.id)} className="text-xs text-fresh-600">Marcar lido</button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">{new Date(a.createdAt).toLocaleString('pt-BR')}</p>
          </div>
        ))}
        {alerts.length === 0 && <p className="text-gray-500">Nenhum alerta. Clique em &quot;Verificar agora&quot;.</p>}
      </div>
    </AdminShell>
  );
}
