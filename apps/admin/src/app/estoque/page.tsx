'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { NumberInput, SelectInput, TextInput } from '@/components/FormFields';
import { PageHeaderDesktop } from '@/components/AdminUI';
import { api, token } from '@/lib/api';

type Product = { id: string; name: string; stockQty: string | number; unitType: string };

const EMPTY_ENTRY = { productId: '', quantity: '', reason: 'Compra fornecedor' };

export default function EstoquePage() {
  const [low, setLow] = useState<Array<{ id: string; name: string; stock_qty: number; min_stock: number }>>([]);
  const [movements, setMovements] = useState<Array<{ id: string; type: string; quantity: string; reason?: string; product: { name: string }; createdAt: string }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [entry, setEntry] = useState(EMPTY_ENTRY);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api<typeof low>('/admin/stock/low').then(setLow);
    api<typeof movements>('/admin/stock/movements').then(setMovements);
    api<Product[]>('/admin/products').then((ps) => {
      setProducts(ps);
      setEntry((e) => ({ ...e, productId: ps[0]?.id ?? '' }));
    });
  };

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  async function submitEntry(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    setMsg('');
    try {
      await api(`/admin/products/${entry.productId}/stock`, {
        method: 'POST',
        body: JSON.stringify({
          quantity: Number(entry.quantity),
          type: 'in',
          reason: entry.reason,
        }),
      });
      setMsg('Entrada registrada com sucesso');
      setEntry({ ...EMPTY_ENTRY, productId: products[0]?.id ?? '' });
      setShowModal(false);
      load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Erro ao registrar entrada');
    } finally {
      setSaving(false);
    }
  }

  function openModal() {
    setEntry({ ...EMPTY_ENTRY, productId: products[0]?.id ?? '' });
    setErr('');
    setMsg('');
    setShowModal(true);
  }

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Estoque"
        description="Registre entradas e monitore produtos em estoque baixo."
        action={
          <button type="button" onClick={openModal} className="admin-btn-primary">
            + Entrada de estoque
          </button>
        }
      />
      <div className="mb-4 flex items-center justify-between xl:hidden">
        <p className="text-sm text-stone-500">Estoque</p>
        <button type="button" onClick={openModal} className="admin-btn-primary text-sm">
          + Entrada
        </button>
      </div>

      {low.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-display text-base font-semibold text-amber-700">Estoque baixo</h2>
          <div className="space-y-2">
            {low.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                <span className="font-medium text-amber-900">{p.name}</span>
                <span className="text-amber-700">{p.stock_qty} / mín {p.min_stock}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-base font-semibold text-stone-900">Últimas movimentações</h2>
        <div className="space-y-2">
          {movements.map((m) => (
            <div key={m.id} className="admin-card flex items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="font-medium text-stone-900">{m.product.name}</p>
                <p className="text-xs text-stone-500">
                  {m.type === 'in' ? '+ entrada' : '- saída'} · {Number(m.quantity)} {m.reason && `· ${m.reason}`}
                </p>
              </div>
              <span className="shrink-0 text-xs text-stone-400">{new Date(m.createdAt).toLocaleString('pt-BR')}</span>
            </div>
          ))}
          {!movements.length && (
            <div className="admin-card border-dashed py-8 text-center text-stone-500">
              Nenhuma movimentação registrada.
            </div>
          )}
        </div>
      </section>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Entrada de estoque"
        subtitle="Registre a chegada de produtos."
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary w-full sm:w-auto">Cancelar</button>
            <button type="submit" form="estoque-form" disabled={saving} className="admin-btn-primary w-full sm:w-auto disabled:opacity-50">
              {saving ? 'Registrando...' : 'Registrar entrada'}
            </button>
          </div>
        }
      >
        <form id="estoque-form" onSubmit={submitEntry} className="space-y-4">
          {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
          <SelectInput label="Produto" required value={entry.productId} onChange={(productId) => setEntry({ ...entry, productId })}>
            <option value="">Selecione o produto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (atual: {Number(p.stockQty)})</option>
            ))}
          </SelectInput>
          <NumberInput label="Quantidade" required step="0.001" min={0.001} value={entry.quantity} onChange={(quantity) => setEntry({ ...entry, quantity })} />
          <TextInput label="Motivo" hint="Ex: Compra fornecedor, ajuste" value={entry.reason} onChange={(reason) => setEntry({ ...entry, reason })} />
        </form>
      </Modal>
    </AdminShell>
  );
}
