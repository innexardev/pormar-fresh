'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { PageHeaderDesktop } from '@/components/AdminUI';
import { api, token } from '@/lib/api';

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  _count: { orders: number };
  orders: Array<{ id: string; total: string | number; status: string; deliveryDate: string }>;
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  out_for_delivery: 'Em rota',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);

  function load(q?: string) {
    const path = q ? `/admin/customers?search=${encodeURIComponent(q)}` : '/admin/customers';
    api<Customer[]>(path).then(setCustomers);
  }

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  function openDetail(c: Customer) {
    setSelected(c);
    setShowModal(true);
  }

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Clientes"
        description="Cadastro de clientes com histórico de pedidos."
      />

      <div className="mb-5 flex gap-2">
        <input
          className="admin-input flex-1 max-w-sm"
          placeholder="Buscar nome ou telefone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
        />
        <button type="button" onClick={() => load(search)} className="admin-btn-primary">
          Buscar
        </button>
      </div>

      <div className="space-y-3">
        {customers.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => openDetail(c)}
            className="admin-card w-full text-left transition active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fresh-100 text-sm font-bold text-fresh-700">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 truncate">{c.name}</p>
                    <p className="text-xs text-stone-500">{c.phone}{c.email && ` · ${c.email}`}</p>
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold text-fresh-700">{c._count.orders}</p>
                <p className="text-[11px] text-stone-400">pedido(s)</p>
              </div>
            </div>
          </button>
        ))}
        {!customers.length && (
          <div className="admin-card border-dashed py-12 text-center text-stone-500">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>

      <Modal
        open={showModal && !!selected}
        onClose={() => setShowModal(false)}
        title={selected?.name ?? ''}
        subtitle={`${selected?.phone}${selected?.email ? ` · ${selected.email}` : ''}`}
        size="md"
        footer={null}
      >
        {selected && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-stone-500">
                Cliente desde {new Date(selected.createdAt).toLocaleDateString('pt-BR')}
              </p>
              <span className="rounded-full bg-fresh-100 px-2.5 py-0.5 text-sm font-semibold text-fresh-800">
                {selected._count.orders} pedido(s)
              </span>
            </div>
            {selected.orders.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Histórico de pedidos</p>
                {selected.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-stone-800">#{o.id.slice(0, 8)}</p>
                      <p className="text-xs text-stone-500">{o.deliveryDate.slice(0, 10)} · {STATUS_LABEL[o.status] ?? o.status}</p>
                    </div>
                    <span className="text-sm font-bold text-fresh-700">R$ {Number(o.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-stone-400">Nenhum pedido ainda.</p>
            )}
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}
