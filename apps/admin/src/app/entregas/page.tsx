'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminShell } from '@/components/AdminShell';
import { PageHeader, PageHeaderDesktop, Panel } from '@/components/AdminUI';
import { api, token } from '@/lib/api';

type DeliveryStop = {
  stop_number: number;
  order_id: string;
  order_short: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  status_label: string;
  delivery_label: string;
  neighborhood: string;
  address_line: string;
  maps_url: string;
  waze_url: string;
  total: number;
  notes?: string | null;
  distance_from_prev_km?: number;
  items: Array<{ name: string; quantity: number; unit: string }>;
};

type DeliveryRoute = {
  delivery_date: string;
  stops_count: number;
  route_optimized: boolean;
  route_engine?: string;
  total_distance_km: number | null;
  eta_minutes?: number | null;
  depot: { address_line: string } | null;
  stops: DeliveryStop[];
  maps_route_url: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  preparing: 'Cortando',
  ready: 'Pronto',
  out_for_delivery: 'Em rota',
  delivered: 'Entregue',
};

const BULK_STATUSES = [
  { value: 'ready', label: 'Marcar como Pronto' },
  { value: 'out_for_delivery', label: 'Saiu para entrega' },
  { value: 'delivered', label: 'Entregue' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function whatsappLink(phone: string, text: string) {
  const n = phone.replace(/\D/g, '');
  return `https://wa.me/55${n.startsWith('55') ? n.slice(2) : n}?text=${encodeURIComponent(text)}`;
}

function EntregasContent() {
  const searchParams = useSearchParams();
  const [deliveryDate, setDeliveryDate] = useState(searchParams.get('date') ?? todayIso());
  const [data, setData] = useState<DeliveryRoute | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('out_for_delivery');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setData(await api<DeliveryRoute>(`/admin/orders/delivery-route?delivery_date=${deliveryDate}`));
    setSelected(new Set());
  }, [deliveryDate]);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    void load();
  }, [load]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (!data) return;
    if (selected.size === data.stops.length) setSelected(new Set());
    else setSelected(new Set(data.stops.map((s) => s.order_id)));
  }

  async function applyBulkStatus() {
    if (!selected.size) return;
    if (!confirm(`Atualizar ${selected.size} pedido(s) para "${STATUS_LABEL[bulkStatus] ?? bulkStatus}"?`)) return;
    setBusy(true);
    try {
      const res = await api<{ success: number; failed: number }>('/admin/orders/bulk-status', {
        method: 'PATCH',
        body: JSON.stringify({ order_ids: Array.from(selected), status: bulkStatus }),
      });
      alert(`${res.success} atualizado(s)${res.failed ? `, ${res.failed} falha(s)` : ''}.`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Entregas & rotas"
        description="Ordem sugerida por bairro — abra no Google Maps ou Waze."
        action={
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="admin-label">Data de entrega</label>
              <input type="date" className="admin-input w-auto py-2" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
            <button type="button" onClick={() => void load()} className="admin-btn-primary py-2">Atualizar</button>
            <Link href={`/pedidos/separacao?date=${deliveryDate}`} className="admin-btn-secondary py-2">Separação</Link>
            <Link href={`/entregador?date=${deliveryDate}`} className="admin-btn-primary bg-green-600 py-2 shadow-green-600/20">App entregador</Link>
          </div>
        }
      />
      <PageHeader
        title="Entregas"
        action={
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <input type="date" className="admin-input flex-1 py-2" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" onClick={() => void load()} className="admin-btn-primary flex-1 py-2 text-sm">Atualizar</button>
              <Link href={`/entregador?date=${deliveryDate}`} className="admin-btn-primary flex-1 bg-green-600 py-2 text-sm shadow-green-600/20">Entregador</Link>
            </div>
          </div>
        }
      />

      {data && (
        <>
          <Panel className="mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-display text-lg font-bold text-stone-900">{formatDateBr(data.delivery_date)} · {data.stops_count} parada(s)</p>
                <p className="mt-1 text-sm text-stone-500">
                  {data.route_engine === 'google_traffic'
                    ? `Rota Google com trânsito${data.eta_minutes != null ? ` · ~${data.eta_minutes} min` : ''}${data.total_distance_km != null ? ` · ~${data.total_distance_km} km` : ''}`
                    : data.route_optimized
                      ? `Rota otimizada${data.total_distance_km != null ? ` · ~${data.total_distance_km} km` : ''}`
                      : 'Ordem por bairro'}
                </p>
                {data.depot?.address_line && (
                  <p className="mt-1 text-xs text-stone-400">Saída: {data.depot.address_line}</p>
                )}
              </div>
              {data.maps_route_url && (
                <a
                  href={data.maps_route_url}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-btn-primary w-full bg-blue-600 text-center shadow-blue-600/20 sm:w-auto"
                >
                  Abrir rota no Maps
                </a>
              )}
            </div>
          </Panel>

          {data.stops_count > 0 && (
            <div className="no-print admin-card mb-4 flex flex-wrap items-center gap-2 border-fresh-200 bg-fresh-50/50">
              <button type="button" onClick={selectAll} className="admin-btn-secondary py-2 text-xs sm:text-sm">
                {selected.size === data.stops.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
              <select className="admin-input w-auto shrink-0 py-2" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                {BULK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selected.size || busy}
                onClick={() => void applyBulkStatus()}
                className="admin-btn-primary py-2 text-xs disabled:opacity-50 sm:text-sm"
              >
                Aplicar ({selected.size || 0})
              </button>
            </div>
          )}

          <div className="space-y-3">
            {data.stops.map((stop) => (
              <article key={stop.order_id} className="admin-card">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="no-print mt-1 h-5 w-5 shrink-0 rounded"
                    checked={selected.has(stop.order_id)}
                    onChange={() => toggleSelect(stop.order_id)}
                  />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-fresh-600 text-sm font-bold text-white shadow-lg shadow-fresh-600/30">
                    {stop.stop_number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900">#{stop.order_short} — {stop.customer_name}</p>
                        <p className="text-sm text-stone-600">{stop.customer_phone} · {stop.neighborhood || 'Sem bairro'}</p>
                        <p className="mt-1 text-sm text-stone-700">{stop.address_line}</p>
                        {stop.distance_from_prev_km != null && (
                          <p className="text-xs text-stone-400">{stop.distance_from_prev_km} km da parada anterior</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium">{stop.status_label}</span>
                        <p className="font-bold text-fresh-700">R$ {stop.total.toFixed(2)}</p>
                      </div>
                    </div>
                    {stop.notes && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Obs: {stop.notes}</p>}
                    <ul className="mt-2 text-sm text-stone-600">
                      {stop.items.map((i, idx) => (
                        <li key={idx}>{i.quantity} {i.unit} — {i.name}</li>
                      ))}
                    </ul>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      <a href={stop.maps_url} target="_blank" rel="noreferrer" className="admin-btn-secondary border-blue-200 py-2 text-center text-xs text-blue-700 sm:text-sm">
                        Maps
                      </a>
                      <a href={stop.waze_url} target="_blank" rel="noreferrer" className="admin-btn-secondary border-indigo-200 py-2 text-center text-xs text-indigo-700 sm:text-sm">
                        Waze
                      </a>
                      <a
                        href={whatsappLink(stop.customer_phone, `Olá ${stop.customer_name}! Seu pedido Pomar Fresh #${stop.order_short} está a caminho.`)}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-btn-secondary border-green-300 py-2 text-center text-xs text-green-700 sm:text-sm"
                      >
                        WhatsApp
                      </a>
                      <Link href="/pedidos" className="admin-btn-secondary py-2 text-center text-xs sm:text-sm">
                        Pedido
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!data.stops.length && (
              <p className="rounded-xl border border-dashed p-8 text-center text-stone-500">
                Nenhuma entrega programada para esta data.
              </p>
            )}
          </div>
        </>
      )}
    </AdminShell>
  );
}

export default function EntregasPage() {
  return (
    <Suspense fallback={<AdminShell><p className="p-8">Carregando...</p></AdminShell>}>
      <EntregasContent />
    </Suspense>
  );
}
