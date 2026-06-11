'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';

const STATUS: Record<string, string> = {
  pending: 'Aguardando pagamento',
  confirmed: 'Confirmado — preparando para o corte',
  preparing: 'Cortando no dia',
  ready: 'Pronto para entrega',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export default function PedidoPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<{
    order_id: string;
    status: string;
    total: number;
    delivery_label: string;
    delivery_date: string;
    items: Array<{ name: string; quantity: number; unit: string; line_total: number }>;
    timeline: Array<{ status: string; at: string }>;
    payment_status: string;
  } | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchApi<typeof order>(`/public/orders/${id}`).then(setOrder);
  }, [id]);

  async function simulatePix() {
    setPaying(true);
    try {
      await fetchApi(`/public/orders/${id}/payments/simulate`, { method: 'POST' });
      const updated = await fetchApi<typeof order>(`/public/orders/${id}`);
      setOrder(updated);
    } finally {
      setPaying(false);
    }
  }

  if (!order) return <p className="p-8 text-center">Carregando pedido...</p>;

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Pedido confirmado</h1>
      <p className="text-stone-600">#{order.order_id.slice(0, 8).toUpperCase()}</p>

      <div className="mt-6 rounded-xl border bg-white p-5">
        <p className="font-semibold text-fresh-700">{STATUS[order.status] ?? order.status}</p>
        <p className="mt-1 text-sm">Entrega: {order.delivery_label} ({order.delivery_date})</p>
        <p className="mt-2 text-lg font-bold">Total: R$ {order.total.toFixed(2)}</p>
      </div>

      {order.status === 'pending' && (
        <button
          onClick={simulatePix}
          disabled={paying}
          className="mt-4 w-full rounded-full bg-green-600 py-3 font-semibold text-white"
        >
          {paying ? 'Confirmando...' : 'Simular pagamento Pix (demo)'}
        </button>
      )}

      <h2 className="mb-3 mt-8 font-semibold">Itens</h2>
      <ul className="space-y-2">
        {order.items.map((i, idx) => (
          <li key={idx} className="rounded-lg border bg-white p-3 text-sm">
            {i.quantity} {i.unit} — {i.name} · R$ {i.line_total.toFixed(2)}
          </li>
        ))}
      </ul>

      <h2 className="mb-3 mt-8 font-semibold">Acompanhamento</h2>
      <ol className="space-y-2">
        {order.timeline.map((t, idx) => (
          <li key={idx} className="rounded-lg border bg-white p-3 text-sm">
            <p className="font-medium">{STATUS[t.status] ?? t.status}</p>
            <p className="text-stone-500">{new Date(t.at).toLocaleString('pt-BR')}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
