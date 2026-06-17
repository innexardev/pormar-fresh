'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

type SeparationOrder = {
  order_id: string;
  order_short: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  status_label: string;
  delivery_label: string;
  delivery_date: string;
  total: number;
  address_line: string;
  notes?: string | null;
  items: Array<{ name: string; quantity: number; unit: string }>;
};

type SeparationList = {
  delivery_date: string | null;
  orders_count: number;
  aggregated: Array<{ name: string; quantity: number; unit: string }>;
  orders: SeparationOrder[];
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  preparing: 'Cortando',
  ready: 'Pronto',
  out_for_delivery: 'Em rota',
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function SeparacaoPage() {
  const [deliveryDate, setDeliveryDate] = useState(todayIso());
  const [data, setData] = useState<SeparationList | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [checkedOrders, setCheckedOrders] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const q = deliveryDate ? `?delivery_date=${deliveryDate}` : '';
    const res = await api<SeparationList>(`/admin/orders/separation-list${q}`);
    setData(res);
    setCheckedItems({});
    setCheckedOrders({});
  }, [deliveryDate]);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    void load();
  }, [load]);

  const allItemsChecked = useMemo(() => {
    if (!data?.aggregated.length) return false;
    return data.aggregated.every((item) => checkedItems[`${item.name}|${item.unit}`]);
  }, [data, checkedItems]);

  function toggleItem(key: string) {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleOrder(id: string) {
    setCheckedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleAllItems() {
    if (!data) return;
    const next = !allItemsChecked;
    const map: Record<string, boolean> = {};
    for (const item of data.aggregated) {
      map[`${item.name}|${item.unit}`] = next;
    }
    setCheckedItems(map);
  }

  function printPdf() {
    window.print();
  }

  const printedAt = new Date().toLocaleString('pt-BR');

  return (
    <AdminShell>
      <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/pedidos" className="text-sm text-fresh-700 hover:underline">← Pedidos</Link>
          <h1 className="mt-1 text-2xl font-bold">Lista de separação</h1>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Data de entrega</label>
            <input type="date" className="rounded border p-2 text-sm" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <button type="button" onClick={() => void load()} className="rounded bg-fresh-600 px-4 py-2 text-sm text-white">Atualizar</button>
          {data && (
            <>
              <button type="button" onClick={printPdf} className="rounded border px-4 py-2 text-sm font-medium">Imprimir / PDF</button>
              <Link href={`/entregas?date=${deliveryDate}`} className="rounded border border-fresh-600 px-4 py-2 text-sm font-semibold text-fresh-700">
                Ver rota de entrega
              </Link>
            </>
          )}
        </div>
      </div>

      {!data && <p className="text-gray-500">Carregando...</p>}

      {data && (
        <div className="print-document space-y-8">
          <header className="print-break-inside-avoid border-b border-stone-300 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold">Pomar Fresh — Lista de separação</h1>
                <p className="mt-1 text-sm text-stone-600">
                  Entrega: {data.delivery_date ? formatDateBr(data.delivery_date) : 'Todas'} · {data.orders_count} pedido(s)
                </p>
              </div>
              <p className="text-xs text-stone-500">Gerado em {printedAt}</p>
            </div>
          </header>

          <section className="print-break-inside-avoid">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">1. Resumo de clientes</h2>
              <span className="no-print text-xs text-stone-500">Use na expedição e conferência de pedidos</span>
            </div>
            {data.orders.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-stone-500">
                Nenhum pedido confirmado para esta data. Confirme pagamentos em Pedidos ou escolha outra data.
              </p>
            ) : (
              <table className="print-table admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Endereço</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((o, idx) => (
                    <tr key={o.order_id}>
                      <td>{idx + 1}</td>
                      <td className="font-mono text-xs">{o.order_short}</td>
                      <td className="font-medium">{o.customer_name}</td>
                      <td>{o.customer_phone}</td>
                      <td className="max-w-xs text-xs">{o.address_line}</td>
                      <td>{o.status_label}</td>
                      <td>R$ {o.total.toFixed(2)}</td>
                      <td>
                        <span className="no-print">
                          <input
                            type="checkbox"
                            checked={!!checkedOrders[o.order_id]}
                            onChange={() => toggleOrder(o.order_id)}
                            title="Pedido separado e conferido"
                          />
                        </span>
                        <span className="hidden print:inline-block">
                          <span className="print-check" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="print-break-before print-break-inside-avoid">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">2. Consolidado de produção</h2>
              <button type="button" onClick={toggleAllItems} className="no-print text-xs font-medium text-fresh-700 hover:underline">
                {allItemsChecked ? 'Desmarcar todos' : 'Marcar todos separados'}
              </button>
            </div>
            <table className="print-table admin-table">
              <thead>
                <tr>
                  <th className="w-10">✓</th>
                  <th>Item</th>
                  <th>Quantidade total</th>
                </tr>
              </thead>
              <tbody>
                {data.aggregated.map((item) => {
                  const key = `${item.name}|${item.unit}`;
                  return (
                    <tr key={key}>
                      <td>
                        <span className="no-print">
                          <input type="checkbox" checked={!!checkedItems[key]} onChange={() => toggleItem(key)} />
                        </span>
                        <span className="hidden print:inline-block">
                          <span className="print-check" />
                        </span>
                      </td>
                      <td>{item.name}</td>
                      <td className="font-semibold">{item.quantity} {item.unit}</td>
                    </tr>
                  );
                })}
                {!data.aggregated.length && (
                  <tr><td colSpan={3} className="py-4 text-center text-stone-500">Sem itens</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="print-break-before space-y-4">
            <h2 className="text-lg font-semibold">3. Detalhe por pedido</h2>
            {data.orders.map((o) => (
              <article key={o.order_id} className="print-break-inside-avoid rounded-xl border border-stone-200 bg-white p-4 print:rounded-none print:border print:p-3">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-100 pb-2">
                  <div>
                    <p className="font-semibold">
                      #{o.order_short} — {o.customer_name}
                    </p>
                    <p className="text-sm text-stone-600">{o.customer_phone} · {o.delivery_label}</p>
                    <p className="text-xs text-stone-500">{o.address_line}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{o.status_label}</p>
                    <p className="font-semibold">R$ {o.total.toFixed(2)}</p>
                  </div>
                </div>
                {o.notes && <p className="mt-2 text-sm text-amber-800">Obs: {o.notes}</p>}
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-stone-500">
                      <th className="w-8 py-1">✓</th>
                      <th className="py-1">Qtd</th>
                      <th className="py-1">Item</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((i, idx) => (
                      <tr key={idx} className="border-b border-stone-50">
                        <td className="py-1"><span className="print-check" /></td>
                        <td className="py-1 font-medium">{i.quantity} {i.unit}</td>
                        <td className="py-1">{i.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex gap-6 text-xs text-stone-500">
                  <span>Separado: ___________</span>
                  <span>Conferido: ___________</span>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </AdminShell>
  );
}
