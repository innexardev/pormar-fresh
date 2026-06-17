'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { PageHeader, PageHeaderDesktop } from '@/components/AdminUI';
import { api, token } from '@/lib/api';

type Staff = {
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  role_label: string;
  active: boolean;
  created_at: string;
};

const ROLES = [
  { value: 'admin', label: 'Administrador — acesso total' },
  { value: 'staff', label: 'Operação — pedidos, estoque, entregas' },
];

const EMPTY = {
  email: '',
  password: '',
  full_name: '',
  phone: '',
  role: 'staff',
  send_whatsapp: true,
};

export default function FuncionariosPage() {
  const [list, setList] = useState<Staff[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);

  function load() {
    if (!token()) { window.location.href = '/'; return; }
    api<Staff[]>('/admin/staff').then(setList).catch((e) => setErr((e as Error).message));
  }

  useEffect(() => { load(); }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const res = await api<{ whatsapp_sent?: boolean }>('/admin/staff', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm(EMPTY);
      setShowModal(false);
      setMsg(res.whatsapp_sent ? 'Funcionário criado e credenciais enviadas no WhatsApp.' : 'Funcionário criado.');
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao cadastrar');
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(u: Staff) {
    await api(`/admin/staff/${u.user_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !u.active }),
    });
    load();
  }

  async function resendCredentials(u: Staff) {
    const password = prompt(`Nova senha para ${u.full_name} (deixe vazio para reenviar sem alterar):`);
    if (password === null) return;
    setBusy(true);
    try {
      const res = await api<{ whatsapp_sent: boolean }>(`/admin/staff/${u.user_id}/send-credentials`, {
        method: 'POST',
        body: JSON.stringify(password ? { password } : {}),
      });
      setMsg(res.whatsapp_sent ? 'Credenciais enviadas no WhatsApp.' : 'WhatsApp indisponível — copie manualmente.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao enviar');
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setForm(EMPTY);
    setErr('');
    setShowModal(true);
  }

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Funcionários"
        description="Cadastre a equipe com acesso ao painel. Credenciais podem ser enviadas no WhatsApp."
        action={
          <button type="button" onClick={openCreate} className="admin-btn-primary">
            + Novo funcionário
          </button>
        }
      />
      <PageHeader
        title="Funcionários"
        action={
          <button type="button" onClick={openCreate} className="admin-btn-primary w-full text-sm">
            + Novo funcionário
          </button>
        }
      />

      {msg && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {msg}
        </div>
      )}
      {err && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="admin-card p-0 overflow-hidden">
        <div className="border-b border-stone-100 px-5 py-4">
          <p className="font-display font-semibold text-stone-900">Equipe ({list.length})</p>
        </div>
        <ul className="divide-y divide-stone-100">
          {list.map((u) => (
            <li key={u.user_id} className={`flex flex-wrap items-center gap-3 px-5 py-4 sm:gap-4 ${!u.active ? 'opacity-60' : ''}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-fresh-100 font-bold text-fresh-700">
                {u.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-stone-900">{u.full_name}</p>
                <p className="text-sm text-stone-500">{u.email}{u.phone && ` · ${u.phone}`}</p>
                <p className="mt-0.5 text-xs font-medium text-fresh-700">{u.role_label}{!u.active && ' · Inativo'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void resendCredentials(u)}
                  disabled={!u.phone || busy}
                  className="admin-btn-secondary border-green-200 py-1.5 text-xs text-green-700 disabled:opacity-40"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => void toggleActive(u)}
                  className="admin-btn-secondary py-1.5 text-xs"
                >
                  {u.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </li>
          ))}
          {!list.length && (
            <li className="px-5 py-10 text-center text-sm text-stone-500">
              Nenhum funcionário cadastrado.
            </li>
          )}
        </ul>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Novo funcionário"
        subtitle="Preencha os dados. As credenciais serão enviadas no WhatsApp."
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary w-full sm:w-auto">
              Cancelar
            </button>
            <button
              type="submit"
              form="staff-form"
              disabled={busy}
              className="admin-btn-primary w-full sm:w-auto disabled:opacity-50"
            >
              {busy ? 'Cadastrando...' : 'Cadastrar funcionário'}
            </button>
          </div>
        }
      >
        <form id="staff-form" onSubmit={(e) => void create(e)} className="space-y-4">
          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}
          <div>
            <label className="admin-label">Nome completo</label>
            <input className="admin-input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="admin-label">E-mail (login)</label>
            <input className="admin-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="admin-label">Celular (WhatsApp)</label>
            <input className="admin-input" placeholder="13999999999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div>
            <label className="admin-label">Senha inicial</label>
            <input className="admin-input" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="admin-label">Papel</label>
            <select className="admin-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-700 cursor-pointer hover:bg-stone-50">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={form.send_whatsapp}
              onChange={(e) => setForm({ ...form, send_whatsapp: e.target.checked })}
            />
            Enviar link, e-mail e senha no WhatsApp
          </label>
        </form>
      </Modal>
    </AdminShell>
  );
}
