'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { PageHeaderDesktop } from '@/components/AdminUI';
import { TextInput } from '@/components/FormFields';
import { api, token } from '@/lib/api';

type Supplier = {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  contactName: string | null;
  categories: string[];
  paymentTerms: string | null;
  active: boolean;
  _count?: { purchases: number; invoices: number };
};

const EMPTY = {
  legalName: '',
  tradeName: '',
  cnpj: '',
  phone: '',
  email: '',
  contactName: '',
  categories: 'hortifruti',
  paymentTerms: '',
};

export default function FornecedoresPage() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api<Supplier[]>(`/admin/suppliers${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(setItems);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, [search]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
    setShowModal(true);
  }

  function openEdit(s: Supplier) {
    setEditingId(s.id);
    setForm({
      legalName: s.legalName,
      tradeName: s.tradeName ?? '',
      cnpj: s.cnpj ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      contactName: s.contactName ?? '',
      categories: s.categories.join(', '),
      paymentTerms: s.paymentTerms ?? '',
    });
    setError('');
    setShowModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        categories: form.categories.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (editingId) {
        await api(`/admin/suppliers/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/admin/suppliers', { method: 'POST', body: JSON.stringify(payload) });
      }
      setForm(EMPTY);
      setShowModal(false);
      load();
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'Erro');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSupplier(s: Supplier) {
    if (!confirm(`Excluir fornecedor "${s.tradeName || s.legalName}"?`)) return;
    try {
      await api(`/admin/suppliers/${s.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir fornecedor');
    }
  }

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Fornecedores"
        description="Cadastro de fornecedores de hortifruti, embalagens e insumos."
        action={
          <button type="button" onClick={openCreate} className="admin-btn-primary">
            + Novo fornecedor
          </button>
        }
      />
      <div className="mb-4 flex items-center justify-between xl:hidden">
        <p className="text-sm text-stone-500">{items.length} fornecedor(es)</p>
        <button type="button" onClick={openCreate} className="admin-btn-primary text-sm">
          + Novo fornecedor
        </button>
      </div>

      <input
        placeholder="Buscar por nome ou CNPJ…"
        className="admin-input mb-4 max-w-md"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="admin-card overflow-hidden p-0">
        <div className="admin-table-wrap px-0">
          <table className="admin-table min-w-[520px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Fornecedor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">CNPJ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Contato</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Compras</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50/60">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-stone-900">{s.tradeName || s.legalName}</p>
                    {s.tradeName && <p className="text-xs text-stone-500">{s.legalName}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-stone-600">{s.cnpj ?? '—'}</td>
                  <td className="px-4 py-3.5 text-sm text-stone-600">{s.phone ?? s.email ?? '—'}</td>
                  <td className="px-4 py-3.5 text-stone-600">{s._count?.purchases ?? 0}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => openEdit(s)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-fresh-700 hover:bg-fresh-50">
                        Editar
                      </button>
                      <button type="button" onClick={() => void deleteSupplier(s)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-stone-500">Nenhum fornecedor encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar fornecedor' : 'Novo fornecedor'}
        subtitle={editingId ? 'Altere os dados e salve.' : 'Preencha os dados do fornecedor.'}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary w-full sm:w-auto">Cancelar</button>
            <button type="submit" form="fornecedor-form" disabled={saving} className="admin-btn-primary w-full sm:w-auto disabled:opacity-50">
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar fornecedor'}
            </button>
          </div>
        }
      >
        <form id="fornecedor-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <TextInput label="Razão social" value={form.legalName} onChange={(v) => setForm({ ...form, legalName: v })} required />
          <TextInput label="Nome fantasia" value={form.tradeName} onChange={(v) => setForm({ ...form, tradeName: v })} />
          <TextInput label="CNPJ" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: v })} />
          <TextInput label="Telefone / WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <TextInput label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <TextInput label="Contato" value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} />
          <TextInput label="Categorias (vírgula)" value={form.categories} onChange={(v) => setForm({ ...form, categories: v })} />
          <TextInput label="Prazo pagamento" value={form.paymentTerms} onChange={(v) => setForm({ ...form, paymentTerms: v })} />
        </form>
      </Modal>
    </AdminShell>
  );
}
