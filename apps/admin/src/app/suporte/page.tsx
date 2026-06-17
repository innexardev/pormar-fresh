'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { PageHeader, Panel } from '@/components/AdminUI';
import { api, token } from '@/lib/api';

type Ticket = {
  id: string;
  phone: string;
  customerName: string | null;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  messages: Array<{ id: string; direction: string; body: string; createdAt: string }>;
  customer: { name: string; phone: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em atendimento',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-fresh-100 text-fresh-800',
  closed: 'bg-stone-100 text-stone-500',
};

export default function SuportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reply, setReply] = useState('');
  const [openCount, setOpenCount] = useState(0);

  const load = () => {
    const q = filter ? `?status=${filter}` : '';
    api<Ticket[]>(`/admin/support/tickets${q}`).then(setTickets);
    api<{ open: number }>('/admin/support/tickets/count').then((r) => setOpenCount(r.open));
  };

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, [filter]);

  async function openTicket(id: string) {
    const t = await api<Ticket>(`/admin/support/tickets/${id}`);
    setSelected(t);
    setShowModal(true);
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    await api(`/admin/support/tickets/${selected.id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message: reply }),
    });
    setReply('');
    const updated = await api<Ticket>(`/admin/support/tickets/${selected.id}`);
    setSelected(updated);
    load();
  }

  async function setStatus(status: string) {
    if (!selected) return;
    await api(`/admin/support/tickets/${selected.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const updated = await api<Ticket>(`/admin/support/tickets/${selected.id}`);
    setSelected(updated);
    load();
  }

  const TicketDetail = () => !selected ? null : (
    <div>
      <div className="mb-4">
        <p className="text-sm text-stone-600">{selected.customerName ?? 'Cliente'} · {selected.phone}</p>
        <p className="mt-1 text-sm font-medium text-stone-800">{selected.subject}</p>
        <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[selected.status] ?? 'bg-stone-100 text-stone-600'}`}>
          {STATUS_LABEL[selected.status] ?? selected.status}
        </span>
      </div>

      <div className="mb-4 max-h-64 space-y-2 overflow-y-auto rounded-xl bg-stone-50 p-3">
        {selected.messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl px-3 py-2 text-sm ${m.direction === 'inbound' ? 'bg-white text-stone-800 shadow-sm' : 'ml-6 bg-fresh-100 text-fresh-900'}`}
          >
            {m.body}
            <p className="mt-1 text-[10px] opacity-60">{new Date(m.createdAt).toLocaleString('pt-BR')}</p>
          </div>
        ))}
        {!selected.messages.length && <p className="text-center text-sm text-stone-400">Sem mensagens.</p>}
      </div>

      <textarea
        className="admin-input mb-3 min-h-[80px] text-sm"
        placeholder="Resposta via WhatsApp…"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void sendReply()} disabled={!reply.trim()} className="admin-btn-primary text-sm disabled:opacity-50">
          Enviar resposta
        </button>
        {selected.status === 'open' && (
          <button type="button" onClick={() => void setStatus('in_progress')} className="admin-btn-secondary text-sm">Em atendimento</button>
        )}
        {selected.status !== 'resolved' && selected.status !== 'closed' && (
          <button type="button" onClick={() => void setStatus('resolved')} className="admin-btn-secondary text-sm">Resolver</button>
        )}
        {selected.status !== 'closed' && (
          <button type="button" onClick={() => void setStatus('closed')} className="admin-btn-secondary text-sm">Fechar</button>
        )}
      </div>
    </div>
  );

  return (
    <AdminShell>
      <PageHeader
        title="Suporte"
        description={`${openCount} chamado(s) aberto(s). Cliente envia *suporte* ou digita 4 no menu.`}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setFilter(s)}
            className={`chip-filter ${filter === s ? 'chip-filter-active' : ''}`}
          >
            {s ? STATUS_LABEL[s] : 'Todos'}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-2">
          {!tickets.length && (
            <div className="admin-card border-dashed py-10 text-center text-stone-500">Nenhum chamado encontrado.</div>
          )}
          {tickets.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => void openTicket(t.id)}
              className={`admin-card w-full text-left transition active:scale-[0.99] ${selected?.id === t.id ? 'ring-2 ring-fresh-400' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{t.customerName ?? t.phone}</p>
                  <p className="mt-0.5 truncate text-sm text-stone-600">{t.subject}</p>
                  <p className="mt-1 text-xs text-stone-400">{new Date(t.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[t.status] ?? 'bg-stone-100 text-stone-600'}`}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop side panel */}
        {selected && (
          <div className="admin-card hidden xl:block">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-stone-900">
                Chamado #{selected.id.slice(0, 8).toUpperCase()}
              </h2>
              <button type="button" onClick={() => setSelected(null)} className="text-stone-400 hover:text-stone-600">✕</button>
            </div>
            <TicketDetail />
          </div>
        )}
      </div>

      {/* Mobile modal */}
      <Modal
        open={showModal && !!selected}
        onClose={() => setShowModal(false)}
        title={`Chamado #${selected?.id.slice(0, 8).toUpperCase() ?? ''}`}
        subtitle={selected?.phone}
        size="lg"
        footer={null}
      >
        <TicketDetail />
      </Modal>
    </AdminShell>
  );
}
