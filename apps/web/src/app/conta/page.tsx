'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { customerApi, customerToken, logoutCustomer, setCustomerToken } from '@/lib/customer-auth';

const STATUS: Record<string, string> = {
  pending: 'Aguardando pagamento',
  confirmed: 'Confirmado',
  preparing: 'Em separação',
  ready: 'Pronto',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

type Order = {
  order_id: string;
  status: string;
  total: number;
  delivery_date: string;
  delivery_label: string;
  created_at: string;
};

export default function ContaPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code' | 'orders'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (customerToken()) {
      setStep('orders');
      customerApi<Order[]>('/public/auth/me/orders').then(setOrders).catch(() => {
        logoutCustomer();
        setStep('phone');
      });
    }
  }, []);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await fetchApi('/public/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setStep('code');
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetchApi<{ access_token: string }>('/public/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
      setCustomerToken(res.access_token);
      const list = await customerApi<Order[]>('/public/auth/me/orders');
      setOrders(list);
      setStep('orders');
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Código inválido');
    } finally {
      setLoading(false);
    }
  }

  function sair() {
    logoutCustomer();
    setStep('phone');
    setOrders([]);
    setCode('');
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-2 font-display text-3xl font-bold">Minha conta</h1>
      <p className="mb-8 text-sm text-stone-500">Acompanhe seus pedidos pelo WhatsApp cadastrado.</p>

      {step === 'phone' && (
        <form onSubmit={requestOtp} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-stone-700">
            WhatsApp
            <input
              required
              type="tel"
              className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-full bg-fresh-600 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? 'Enviando…' : 'Receber código no WhatsApp'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={verifyOtp} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-600">Digite o código de 6 dígitos enviado para {phone}</p>
          <input
            required
            inputMode="numeric"
            maxLength={6}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-center text-2xl tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-full bg-fresh-600 py-3 font-semibold text-white">
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
          <button type="button" onClick={() => setStep('phone')} className="w-full text-sm text-stone-500">
            Voltar
          </button>
        </form>
      )}

      {step === 'orders' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-stone-600">{orders.length} pedido(s)</p>
            <button type="button" onClick={sair} className="text-sm text-stone-500 hover:text-red-600">
              Sair
            </button>
          </div>
          {orders.length === 0 ? (
            <p className="rounded-xl border bg-white p-6 text-center text-stone-500">Nenhum pedido ainda.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.order_id}>
                  <Link
                    href={`/pedido/${o.order_id}`}
                    className="block rounded-xl border bg-white p-4 transition hover:border-fresh-400 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-stone-900">#{o.order_id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-fresh-700">{STATUS[o.status] ?? o.status}</p>
                        <p className="mt-1 text-xs text-stone-500">{o.delivery_label} · {o.delivery_date}</p>
                      </div>
                      <p className="font-bold text-stone-900">R$ {o.total.toFixed(2)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/cardapio" className="mt-6 block text-center text-sm font-medium text-fresh-600">
            Fazer novo pedido →
          </Link>
        </>
      )}
    </main>
  );
}
