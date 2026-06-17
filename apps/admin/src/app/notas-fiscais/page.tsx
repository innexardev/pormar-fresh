'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/AdminShell';
import { PageHeader } from '@/components/AdminUI';
import { api, token } from '@/lib/api';

type Invoice = {
  id: string;
  number: string | null;
  accessKey: string | null;
  status: string;
  totalAmount: string | number | null;
  issueDate: string | null;
  supplier: { legalName: string; tradeName: string | null } | null;
  rawData?: { items?: Array<{ description: string; quantity: number; total: number }> };
};

export default function NotasFiscaisPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [xml, setXml] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState<Invoice | null>(null);

  const load = () => api<Invoice[]>('/admin/purchase-invoices').then(setInvoices);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await api('/admin/purchase-invoices/upload-xml-text', {
        method: 'POST',
        body: JSON.stringify({ xml }),
      });
      setXml('');
      load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await api(`/admin/purchase-invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  }

  return (
    <AdminShell>
      <PageHeader
        title="Notas fiscais"
        description="Importe XML NF-e para identificar fornecedor e itens automaticamente."
      />

      <form onSubmit={upload} className="admin-card mb-8">
        <label className="admin-label">Colar XML da NF-e</label>
        <textarea
          className="admin-input min-h-[160px] font-mono text-xs"
          placeholder="&lt;nfeProc&gt;…"
          value={xml}
          onChange={(e) => setXml(e.target.value)}
        />
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <button type="submit" disabled={loading || !xml.trim()} className="admin-btn-primary mt-4">
          {loading ? 'Importando…' : 'Importar nota'}
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-card overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nota</th>
                <th>Fornecedor</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="cursor-pointer hover:bg-stone-50" onClick={() => setSelected(inv)}>
                  <td>
                    <p className="font-medium">{inv.number ?? '—'}</p>
                    <p className="text-xs text-stone-400">{inv.issueDate?.slice(0, 10) ?? ''}</p>
                  </td>
                  <td className="text-sm">{inv.supplier?.tradeName ?? inv.supplier?.legalName ?? '—'}</td>
                  <td>{inv.totalAmount != null ? `R$ ${Number(inv.totalAmount).toFixed(2)}` : '—'}</td>
                  <td><span className="rounded bg-stone-100 px-2 py-0.5 text-xs">{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="admin-card">
            <h2 className="mb-4 font-semibold">Detalhes da nota</h2>
            <p className="text-sm text-stone-600">Chave: {selected.accessKey?.slice(0, 20) ?? '—'}…</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="admin-btn-secondary text-xs" onClick={() => setStatus(selected.id, 'reviewed')}>Marcar revisada</button>
              <button type="button" className="admin-btn-primary text-xs" onClick={() => setStatus(selected.id, 'posted')}>Lançada</button>
            </div>
            <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto text-sm">
              {(selected.rawData?.items ?? []).map((item, i) => (
                <li key={i} className="rounded-lg border border-stone-100 p-3">
                  <p className="font-medium">{item.description}</p>
                  <p className="text-stone-500">{item.quantity} · R$ {item.total.toFixed(2)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-stone-400">
              Próximo passo: vincular itens a ingredientes em Custos → Ingredientes.
            </p>
            <Link href="/custos/ingredientes" className="mt-2 inline-block text-sm text-fresh-600">Ir para ingredientes →</Link>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
