'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { MobileSheet, PageHeader, PageHeaderDesktop } from '@/components/AdminUI';
import { api, token } from '@/lib/api';

type Order = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total: number;
  delivery_date: string;
  delivery_label: string;
  created_at: string;
};

type OrderDetail = Order & {
  subtotal: number;
  delivery_fee: number;
  discount: number;
  promo_code?: string | null;
  payment_status?: string;
  address: Record<string, string>;
  notes?: string | null;
  items: Array<{ name: string; quantity: number; unit: string; line_total: number }>;
  timeline: Array<{ status: string; at: string }>;
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
  cancelled: 'Cancelado',
};

const BULK_OPTIONS = [
  { value: 'preparing', label: 'Cortando' },
  { value: 'ready', label: 'Pronto' },
  { value: 'out_for_delivery', label: 'Em rota' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
];

const CANCELLABLE = new Set(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']);

const FILTERS = [
  ['active', 'Ativos'],
  ['all', 'Todos'],
  ['pending', 'Pendentes'],
  ['delivered', 'Entregues'],
  ['cancelled', 'Cancelados'],
] as const;

function OrderDetailPanel({
  selected,
  onAdvance,
  onCancel,
  onConfirmPayment,
  whatsappLink,
}: {
  selected: OrderDetail;
  onAdvance: (id: string, status: string) => void;
  onCancel: (id: string) => void;
  onConfirmPayment: (id: string) => void;
  whatsappLink: (phone: string, text: string) => string;
}) {
  return (
    <>
      <h2 className="mb-1 font-display text-xl font-bold">{selected.customer_name}</h2>
      <p className="text-sm text-stone-500">{selected.customer_phone}</p>
      <p className="mt-2 text-sm font-medium text-fresh-700">
        {LABEL[selected.status]} · {selected.delivery_label}
      </p>

      <div className="mt-4 space-y-1 text-sm">
        {selected.items.map((i, idx) => (
          <div key={idx} className="flex justify-between gap-2">
            <span className="min-w-0">{i.quantity} {i.unit} — {i.name}</span>
            <span className="shrink-0">R$ {i.line_total.toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-stone-100 pt-2">
          <div className="flex justify-between"><span>Subtotal</span><span>R$ {selected.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Entrega</span><span>R$ {selected.delivery_fee.toFixed(2)}</span></div>
          {selected.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Desconto {selected.promo_code && `(${selected.promo_code})`}</span>
              <span>− R$ {selected.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-stone-900"><span>Total</span><span>R$ {selected.total.toFixed(2)}</span></div>
        </div>
      </div>

      {selected.address && (
        <p className="mt-3 text-xs text-stone-600">
          {selected.address.street}, {selected.address.number} — {selected.address.neighborhood}, {selected.address.city} — CEP {selected.address.zip_code}
        </p>
      )}
      {selected.notes && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Obs: {selected.notes}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {selected.status === 'pending' && selected.payment_status === 'pending' && (
          <button type="button" onClick={() => onConfirmPayment(selected.order_id)} className="admin-btn-primary min-h-[44px] bg-green-600 shadow-green-600/20">
            Confirmar Pix
          </button>
        )}
        {NEXT[selected.status] && (
          <button type="button" onClick={() => onAdvance(selected.order_id, selected.status)} className="admin-btn-primary">
            Avançar → {LABEL[NEXT[selected.status]]}
          </button>
        )}
        {CANCELLABLE.has(selected.status) && (
          <button type="button" onClick={() => onCancel(selected.order_id)} className="admin-btn-secondary border-red-200 text-red-600">
            Cancelar
          </button>
        )}
        <a
          href={whatsappLink(selected.customer_phone, `Olá ${selected.customer_name}! Sobre seu pedido Pomar Fresh #${selected.order_id.slice(0, 8)}...`)}
          target="_blank"
          rel="noreferrer"
          className="admin-btn-secondary border-green-300 text-green-700"
        >
          WhatsApp
        </a>
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold text-stone-800">Histórico</h3>
      <ul className="space-y-1 text-xs text-stone-500">
        {selected.timeline.map((t, i) => (
          <li key={i}>{LABEL[t.status] ?? t.status} — {new Date(t.at).toLocaleString('pt-BR')}</li>
        ))}
      </ul>
    </>
  );
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('active');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('ready');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const load = useCallback(() => {
    if (!token()) { window.location.href = '/'; return; }
    const params = new URLSearchParams({ status: filter });
    if (deliveryDate) params.set('delivery_date', deliveryDate);
    api<Order[]>(`/admin/orders?${params}`).then((list) => {
      setOrders(list);
      setChecked(new Set());
    });
  }, [filter, deliveryDate]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(id: string) {
    setSelected(await api<OrderDetail>(`/admin/orders/${id}`));
  }

  async function advance(id: string, status: string) {
    const next = NEXT[status];
    if (!next) return;
    await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
    load();
    if (selected?.order_id === id) openDetail(id);
  }

  async function cancel(id: string) {
    if (!confirm('Cancelar este pedido? Estoque será restaurado se já confirmado.')) return;
    await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) });
    setSelected(null);
    load();
  }

  async function confirmPayment(id: string) {
    if (!confirm('Confirmar pagamento Pix deste pedido?')) return;
    await api(`/admin/orders/${id}/confirm-payment`, { method: 'POST' });
    load();
    openDetail(id);
  }

  function toggleCheck(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (checked.size === orders.length) setChecked(new Set());
    else setChecked(new Set(orders.map((o) => o.order_id)));
  }

  async function applyBulk() {
    if (!checked.size) return;
    const label = BULK_OPTIONS.find((o) => o.value === bulkStatus)?.label ?? bulkStatus;
    if (!confirm(`Alterar ${checked.size} pedido(s) para "${label}"?`)) return;
    setBulkBusy(true);
    try {
      const res = await api<{ success: number; failed: number; results: Array<{ order_id: string; ok: boolean; error?: string }> }>(
        '/admin/orders/bulk-status',
        { method: 'PATCH', body: JSON.stringify({ order_ids: Array.from(checked), status: bulkStatus }) },
      );
      const failed = res.results.filter((r) => !r.ok);
      if (failed.length) {
        alert(`${res.success} ok, ${failed.length} falha(s). Alguns pedidos não permitem essa transição de status.`);
      }
      load();
      if (selected && checked.has(selected.order_id)) openDetail(selected.order_id);
    } finally {
      setBulkBusy(false);
    }
  }

  async function exportCsv() {
    const params = new URLSearchParams({ status: filter });
    if (exportFrom) params.set('from', exportFrom);
    if (exportTo) params.set('to', exportTo);
    const res = await api<{ csv: string }>(`/admin/orders/export?${params}`);
    const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function whatsappLink(phone: string, text: string) {
    const n = phone.replace(/\D/g, '');
    return `https://wa.me/55${n.startsWith('55') ? n.slice(2) : n}?text=${encodeURIComponent(text)}`;
  }

  const statusColor = (status: string) => {
    if (status === 'pending') return 'bg-amber-100 text-amber-800';
    if (status === 'delivered') return 'bg-stone-100 text-stone-600';
    if (status === 'cancelled') return 'bg-red-100 text-red-700';
    return 'bg-fresh-100 text-fresh-800';
  };

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Pedidos"
        description="Gerencie pedidos, status e pagamentos."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/entregas" className="admin-btn-secondary">Entregas & rotas</Link>
            <Link href="/pedidos/separacao" className="admin-btn-primary">Lista de separação</Link>
          </div>
        }
      />
      <PageHeader
        title="Pedidos"
        action={
          <div className="flex w-full gap-2">
            <Link href="/entregas" className="admin-btn-secondary flex-1 text-center text-xs sm:text-sm">Entregas</Link>
            <Link href="/pedidos/separacao" className="admin-btn-primary flex-1 text-center text-xs sm:text-sm">Separação</Link>
          </div>
        }
      />

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1">
        {FILTERS.map(([val, lab]) => (
          <button
            key={val}
            type="button"
            onClick={() => setFilter(val)}
            className={`chip-filter ${filter === val ? 'chip-filter-active' : ''}`}
          >
            {lab}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="date"
          className="admin-input w-auto shrink-0 py-2"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          title="Filtrar entrega"
        />
        <button type="button" onClick={() => setShowExport((v) => !v)} className="admin-btn-secondary py-2 text-xs sm:text-sm">
          {showExport ? 'Ocultar export' : 'Exportar CSV'}
        </button>
      </div>

      {showExport && (
        <div className="admin-card mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1">
            <label className="admin-label">De</label>
            <input type="date" className="admin-input" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="admin-label">Até</label>
            <input type="date" className="admin-input" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
          </div>
          <button type="button" onClick={exportCsv} className="admin-btn-primary w-full sm:w-auto">Baixar relatório</button>
        </div>
      )}

      {orders.length > 0 && (
        <div className="admin-card mb-4 flex flex-wrap items-center gap-2 border-fresh-200 bg-fresh-50/60">
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 rounded"
            checked={orders.length > 0 && checked.size === orders.length}
            onChange={toggleAll}
            title="Selecionar todos"
          />
          <span className="text-sm font-medium">{checked.size} selecionado(s)</span>
          <select className="admin-input w-auto shrink-0 py-2" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
            {BULK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={!checked.size || bulkBusy}
            onClick={() => void applyBulk()}
            className="admin-btn-primary py-2 text-xs disabled:opacity-50 sm:text-sm"
          >
            Aplicar em lote
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.order_id}
              className={`admin-card flex gap-3 p-4 transition active:scale-[0.99] ${selected?.order_id === o.order_id ? 'ring-2 ring-fresh-500' : ''}`}
            >
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 rounded"
                checked={checked.has(o.order_id)}
                onChange={() => {}}
                onClick={(e) => toggleCheck(o.order_id, e)}
              />
              <button
                type="button"
                onClick={() => openDetail(o.order_id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-900">{o.customer_name}</p>
                    <p className="mt-0.5 text-xs text-stone-500">{o.delivery_label} · {o.delivery_date}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor(o.status)}`}>
                        {LABEL[o.status] ?? o.status}
                      </span>
                      <span className="text-sm font-bold text-fresh-700">R$ {o.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-stone-400">#{o.order_id.slice(0, 8)}</span>
                </div>
              </button>
            </div>
          ))}
          {!orders.length && (
            <div className="admin-card border-dashed py-12 text-center text-stone-500">
              Nenhum pedido encontrado.
            </div>
          )}
        </div>

        {selected && (
          <div className="hidden lg:block sticky top-4 h-fit admin-card">
            <OrderDetailPanel
              selected={selected}
              onAdvance={advance}
              onCancel={cancel}
              onConfirmPayment={confirmPayment}
              whatsappLink={whatsappLink}
            />
          </div>
        )}
      </div>

      <MobileSheet open={!!selected} onClose={() => setSelected(null)} title={selected?.customer_name}>
        {selected && (
          <OrderDetailPanel
            selected={selected}
            onAdvance={advance}
            onCancel={cancel}
            onConfirmPayment={confirmPayment}
            whatsappLink={whatsappLink}
          />
        )}
      </MobileSheet>
    </AdminShell>
  );
}
