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

type Tracking = {
  status: string;
  driver: { lat: number; lng: number; updated_at: string } | null;
  destination: { lat?: number; lng?: number; address_line?: string };
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
    pix_copy_paste?: string | null;
    payment_provider?: string;
    can_simulate_pix?: boolean;
  } | null>(null);
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchApi<typeof order>(`/public/orders/${id}`).then(setOrder);
  }, [id]);

  useEffect(() => {
    if (!order || !['out_for_delivery', 'ready'].includes(order.status)) return;
    const load = () => fetchApi<Tracking>(`/public/orders/${id}/tracking`).then(setTracking);
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [id, order?.status]);

  useEffect(() => {
    if (!order || order.status !== 'pending') return;
    const t = setInterval(() => {
      fetchApi<typeof order>(`/public/orders/${id}`).then(setOrder);
    }, 30000);
    return () => clearInterval(t);
  }, [id, order?.status]);

  async function simulatePix() {
    setPaying(true);
    try {
      const res = await fetchApi<{ ok: boolean; reason?: string }>(`/public/orders/${id}/payments/simulate`, { method: 'POST' });
      if (res.reason === 'asaas_enabled_use_webhook') {
        alert('Pagamento via Pix real. Após pagar, a confirmação é automática.');
        return;
      }
      const updated = await fetchApi<typeof order>(`/public/orders/${id}`);
      setOrder(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível confirmar o pagamento.');
    } finally {
      setPaying(false);
    }
  }

  async function copyPix() {
    if (!order?.pix_copy_paste) return;
    await navigator.clipboard.writeText(order.pix_copy_paste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!order) return <p className="p-8 text-center">Carregando pedido...</p>;

  const isMock = order.payment_provider !== 'asaas';
  const canSimulate = order.can_simulate_pix === true;

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Pedido confirmado</h1>
      <p className="text-stone-600">#{order.order_id.slice(0, 8).toUpperCase()}</p>
      <p className="mt-2 text-xs text-stone-500">
        Guarde este link ou acesse <a href="/conta" className="text-fresh-600 underline">Minha conta</a> pelo WhatsApp.
      </p>

      <div className="mt-6 rounded-xl border bg-white p-5">
        <p className="font-semibold text-fresh-700">{STATUS[order.status] ?? order.status}</p>
        <p className="mt-1 text-sm">Entrega: {order.delivery_label} ({order.delivery_date})</p>
        <p className="mt-2 text-lg font-bold">Total: R$ {order.total.toFixed(2)}</p>
      </div>

      {order.status === 'out_for_delivery' && tracking?.driver && (
        <div className="mt-4 overflow-hidden rounded-xl border bg-white">
          <div className="border-b px-4 py-3">
            <p className="font-semibold text-fresh-700">Entregador a caminho</p>
            <p className="text-xs text-stone-500">
              Atualizado {new Date(tracking.driver.updated_at).toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <iframe
            title="Localização do entregador"
            className="h-56 w-full border-0"
            loading="lazy"
            src={`https://www.google.com/maps?q=${tracking.driver.lat},${tracking.driver.lng}&z=15&output=embed`}
          />
          {tracking.destination.lat != null && tracking.destination.lng != null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${tracking.driver.lat},${tracking.driver.lng}&destination=${tracking.destination.lat},${tracking.destination.lng}&travelmode=driving`}
              target="_blank"
              rel="noreferrer"
              className="block border-t py-3 text-center text-sm font-semibold text-blue-700"
            >
              Ver rota em tempo real no Maps
            </a>
          )}
        </div>
      )}

      {order.status === 'out_for_delivery' && !tracking?.driver && (
        <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-sm text-blue-900">
          Seu pedido saiu para entrega. O mapa ao vivo aparecerá quando o entregador estiver com GPS ativo.
        </p>
      )}

      {order.status === 'pending' && order.pix_copy_paste && (
        <div className="mt-4 rounded-xl border bg-white p-4">
          <p className="mb-2 text-sm font-medium">Pix copia e cola</p>
          <p className="break-all rounded bg-gray-50 p-2 text-xs">{order.pix_copy_paste}</p>
          <button type="button" onClick={copyPix} className="mt-3 w-full rounded-full border border-fresh-600 py-2 text-sm font-semibold text-fresh-700">
            {copied ? 'Copiado!' : 'Copiar código Pix'}
          </button>
        </div>
      )}

      {order.status === 'pending' && canSimulate && (
        <button
          onClick={simulatePix}
          disabled={paying}
          className="mt-4 w-full rounded-full bg-green-600 py-3 font-semibold text-white"
        >
          {paying ? 'Confirmando...' : 'Simular pagamento Pix (demo)'}
        </button>
      )}

      {order.status === 'pending' && isMock && !canSimulate && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
          Após pagar o Pix, aguarde a confirmação da loja. Você receberá aviso no WhatsApp quando o pagamento for confirmado.
        </p>
      )}

      {order.status === 'pending' && !isMock && (
        <p className="mt-4 text-center text-sm text-stone-500">
          Após pagar o Pix, seu pedido será confirmado automaticamente.
        </p>
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
