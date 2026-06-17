'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { api, token } from '@/lib/api';
import { PageHeaderDesktop, Panel } from '@/components/AdminUI';

type Zone = {
  id: string;
  label: string;
  zipPrefixes: string[];
  neighborhoods: string[] | null;
  deliveryFee: string | number;
  active: boolean;
  sortOrder: number;
};

type Block = { id: string; blockDate: string; reason: string | null };

type DeliveryWindowRow = {
  id: string;
  label: string;
  weekday: number;
  cutoffHour: number;
  orderDeadlineDaysBefore: number;
  active: boolean;
};

type StoreSettings = {
  delivery_fee: number;
  min_order_value: number;
  whatsapp: string | null;
  uses_delivery_zones: boolean;
};

type CepTest = {
  zip_code: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  delivery: { allowed: boolean; delivery_fee: number; zone_label?: string; message?: string };
};

const EMPTY_ZONE = { label: '', zipPrefixes: '', neighborhoods: '', deliveryFee: '12', sortOrder: '0' };

function prefixesToString(v: string[] | unknown): string {
  return Array.isArray(v) ? v.join(', ') : '';
}

export default function EntregaPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [zoneForm, setZoneForm] = useState(EMPTY_ZONE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [testCep, setTestCep] = useState('');
  const [testResult, setTestResult] = useState<CepTest | null>(null);
  const [testError, setTestError] = useState('');
  const [saved, setSaved] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [deliveryWindows, setDeliveryWindows] = useState<DeliveryWindowRow[]>([]);
  const [depotForm, setDepotForm] = useState({
    street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '',
  });
  const [depotSaved, setDepotSaved] = useState(false);
  const [driverPin, setDriverPin] = useState('');
  const [driverPinStatus, setDriverPinStatus] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);

  const load = () => {
    api<Zone[]>('/admin/delivery/zones').then(setZones);
    api<Block[]>('/admin/delivery/blocks').then(setBlocks);
    api<StoreSettings>('/admin/store-settings').then(setSettings);
    api<DeliveryWindowRow[]>('/admin/delivery/windows').then(setDeliveryWindows);
    api<{ address_line: string | null; address: Record<string, string> | null }>('/admin/delivery/depot').then((d) => {
      if (d.address) {
        setDepotForm({
          street: d.address.street ?? '',
          number: d.address.number ?? '',
          complement: d.address.complement ?? '',
          neighborhood: d.address.neighborhood ?? '',
          city: d.address.city ?? '',
          state: d.address.state ?? '',
          zip_code: d.address.zip_code ?? '',
        });
      }
    }).catch(() => undefined);
    api<{ configured: boolean }>('/admin/delivery/driver-pin/status').then((s) => setDriverPinStatus(s.configured));
  };

  async function saveDriverPin(e: FormEvent) {
    e.preventDefault();
    await api('/admin/delivery/driver-pin', { method: 'PATCH', body: JSON.stringify({ pin: driverPin }) });
    setDriverPin('');
    setDriverPinStatus(true);
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 2500);
  }

  async function saveDepot(e: FormEvent) {
    e.preventDefault();
    await api('/admin/delivery/depot', { method: 'PATCH', body: JSON.stringify(depotForm) });
    setDepotSaved(true);
    setTimeout(() => setDepotSaved(false), 2500);
  }

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  function openEdit(z: Zone) {
    setEditingId(z.id);
    setZoneForm({
      label: z.label,
      zipPrefixes: prefixesToString(z.zipPrefixes),
      neighborhoods: prefixesToString(z.neighborhoods),
      deliveryFee: String(z.deliveryFee),
      sortOrder: String(z.sortOrder),
    });
    setShowZoneModal(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setZoneForm(EMPTY_ZONE);
    setShowZoneModal(false);
  }

  async function saveZone(e: FormEvent) {
    e.preventDefault();
    const payload = {
      label: zoneForm.label,
      zipPrefixes: zoneForm.zipPrefixes.split(',').map((s) => s.trim()).filter(Boolean),
      neighborhoods: zoneForm.neighborhoods.split(',').map((s) => s.trim()).filter(Boolean),
      deliveryFee: Number(zoneForm.deliveryFee),
      sortOrder: Number(zoneForm.sortOrder) || 0,
    };
    if (editingId) {
      await api(`/admin/delivery/zones/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    } else {
      await api('/admin/delivery/zones', { method: 'POST', body: JSON.stringify(payload) });
    }
    cancelEdit();
    load();
  }

  async function toggleZone(z: Zone) {
    await api(`/admin/delivery/zones/${z.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !z.active }),
    });
    load();
  }

  async function deleteZone(id: string) {
    if (!confirm('Excluir esta zona de entrega?')) return;
    await api(`/admin/delivery/zones/${id}`, { method: 'DELETE' });
    load();
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    await api('/admin/store-settings', {
      method: 'PATCH',
      body: JSON.stringify({
        deliveryFee: settings.delivery_fee,
        minOrderValue: settings.min_order_value,
        whatsapp: settings.whatsapp,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  }

  async function testCepLookup() {
    setTestError('');
    setTestResult(null);
    try {
      const cep = testCep.replace(/\D/g, '');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1'}/public/delivery/cep/${cep}`);
      if (!res.ok) throw new Error('CEP não encontrado ou inválido');
      setTestResult(await res.json());
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Erro ao consultar');
    }
  }

  async function addBlock(e: FormEvent) {
    e.preventDefault();
    await api('/admin/delivery/blocks', {
      method: 'POST',
      body: JSON.stringify({ block_date: blockDate, reason: blockReason || undefined }),
    });
    setBlockDate('');
    setBlockReason('');
    load();
  }

  async function removeBlock(id: string) {
    await api(`/admin/delivery/blocks/${id}`, { method: 'DELETE' });
    load();
  }

  async function exportCsv() {
    const res = await api<{ csv: string }>('/admin/delivery/zones/export');
    const blob = new Blob([res.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zonas-entrega.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv() {
    setImportResult(null);
    const res = await api<{ imported: number; errors: string[] }>('/admin/delivery/zones/import', {
      method: 'POST',
      body: JSON.stringify({ csv: csvText }),
    });
    setImportResult(res);
    setCsvText('');
    load();
  }

  async function saveWindow(w: DeliveryWindowRow) {
    await api(`/admin/delivery/windows/${w.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        label: w.label,
        cutoff_hour: w.cutoffHour,
        order_deadline_days_before: w.orderDeadlineDaysBefore,
        active: w.active,
      }),
    });
    load();
  }

  return (
    <AdminShell>
      <PageHeaderDesktop
        title="Áreas de entrega"
        description="Zonas por CEP/bairro, janelas de entrega, ponto de saída e bloqueios."
        action={
          <button type="button" onClick={() => { setEditingId(null); setZoneForm(EMPTY_ZONE); setShowZoneModal(true); }} className="admin-btn-primary">
            + Nova zona
          </button>
        }
      />
      <div className="mb-4 flex items-center justify-between xl:hidden">
        <p className="text-sm text-stone-500">{zones.length} zona(s)</p>
        <button type="button" onClick={() => { setEditingId(null); setZoneForm(EMPTY_ZONE); setShowZoneModal(true); }} className="admin-btn-primary text-sm">
          + Nova zona
        </button>
      </div>

      {settings && (
        <Panel title="Configurações gerais" className="mb-6">
          {settings.uses_delivery_zones && (
            <div className="mb-4 rounded-xl bg-fresh-50 px-4 py-3 text-sm text-fresh-800">
              {zones.filter((z) => z.active).length} zona(s) ativa(s) — o checkout usa as taxas das zonas abaixo.
            </div>
          )}
          <form onSubmit={saveSettings} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="admin-label">Taxa padrão (R$)</label>
              <input type="number" step="0.01" className="admin-input" value={settings.delivery_fee} onChange={(e) => setSettings({ ...settings, delivery_fee: Number(e.target.value) })} />
            </div>
            <div>
              <label className="admin-label">Pedido mínimo (R$)</label>
              <input type="number" step="0.01" className="admin-input" value={settings.min_order_value} onChange={(e) => setSettings({ ...settings, min_order_value: Number(e.target.value) })} />
            </div>
            <div>
              <label className="admin-label">WhatsApp loja</label>
              <input className="admin-input" placeholder="5511999999999" value={settings.whatsapp ?? ''} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value || null })} />
            </div>
            <div className="flex items-center gap-3 sm:col-span-3">
              <button type="submit" className="admin-btn-primary">Salvar configurações</button>
              {saved && <span className="text-sm text-fresh-700">Salvo!</span>}
            </div>
          </form>
        </Panel>
      )}

      {deliveryWindows.length > 0 && (
        <Panel title="Prazo para pedidos" className="mb-6">
          <p className="mb-4 text-sm text-stone-500">
            Define até quando o cliente pode pedir para cada dia de entrega.
          </p>
          <div className="space-y-3">
            {deliveryWindows.map((w, idx) => (
              <div key={w.id} className="grid gap-3 rounded-xl border border-stone-100 bg-stone-50/50 p-4 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="admin-label">Janela</label>
                  <input className="admin-input" value={w.label} onChange={(e) => { const next = [...deliveryWindows]; next[idx] = { ...w, label: e.target.value }; setDeliveryWindows(next); }} />
                </div>
                <div>
                  <label className="admin-label">Dias antes</label>
                  <input type="number" min={0} max={7} className="admin-input" value={w.orderDeadlineDaysBefore} onChange={(e) => { const next = [...deliveryWindows]; next[idx] = { ...w, orderDeadlineDaysBefore: Number(e.target.value) }; setDeliveryWindows(next); }} />
                </div>
                <div>
                  <label className="admin-label">Hora limite</label>
                  <input type="number" min={0} max={23} className="admin-input" value={w.cutoffHour} onChange={(e) => { const next = [...deliveryWindows]; next[idx] = { ...w, cutoffHour: Number(e.target.value) }; setDeliveryWindows(next); }} />
                </div>
                <div className="flex items-center gap-3 sm:col-span-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={w.active} onChange={(e) => { const next = [...deliveryWindows]; next[idx] = { ...w, active: e.target.checked }; setDeliveryWindows(next); }} />
                    Ativa
                  </label>
                  <button type="button" onClick={() => void saveWindow(deliveryWindows[idx])} className="admin-btn-primary py-1.5 text-sm">Salvar</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Zonas de entrega" className="mb-6">
        <div className="space-y-3">
          {zones.length === 0 && (
            <p className="rounded-xl border border-dashed py-6 text-center text-stone-500">Nenhuma zona — usa taxa padrão.</p>
          )}
          {zones.map((z) => (
            <div key={z.id} className={`flex flex-wrap items-start justify-between gap-2 rounded-xl border p-4 ${z.active ? 'border-stone-200 bg-white' : 'border-stone-100 bg-stone-50 opacity-70'}`}>
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">{z.label} <span className="ml-2 text-fresh-700">R$ {Number(z.deliveryFee).toFixed(2)}</span></p>
                {!z.active && <span className="text-xs text-stone-400">(inativa)</span>}
                <p className="mt-0.5 text-sm text-stone-600">CEPs: {prefixesToString(z.zipPrefixes) || '—'} · Bairros: {prefixesToString(z.neighborhoods) || 'todos'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => openEdit(z)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-fresh-700 hover:bg-fresh-50">Editar</button>
                <button type="button" onClick={() => void toggleZone(z)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50">{z.active ? 'Desativar' : 'Ativar'}</button>
                <button type="button" onClick={() => void deleteZone(z.id)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Testar CEP" className="mb-6">
        <p className="mb-3 text-sm text-stone-500">Simule se um endereço seria aceito no checkout.</p>
        <div className="flex flex-wrap gap-2">
          <input placeholder="00000-000" className="admin-input w-40" value={testCep} onChange={(e) => setTestCep(e.target.value)} />
          <button type="button" onClick={() => void testCepLookup()} className="admin-btn-secondary">Consultar</button>
        </div>
        {testError && <p className="mt-2 text-sm text-red-600">{testError}</p>}
        {testResult && (
          <div className={`mt-3 rounded-xl p-4 text-sm ${testResult.delivery.allowed ? 'bg-fresh-50 text-fresh-800' : 'bg-red-50 text-red-800'}`}>
            <p>{testResult.street}, {testResult.neighborhood} — {testResult.city}/{testResult.state}</p>
            {testResult.delivery.allowed ? (
              <p className="mt-1 font-semibold">✓ Entrega disponível — {testResult.delivery.zone_label ?? 'Taxa padrão'} — R$ {testResult.delivery.delivery_fee.toFixed(2)}</p>
            ) : (
              <p className="mt-1 font-semibold">✗ {testResult.delivery.message ?? 'Fora da área'}</p>
            )}
          </div>
        )}
      </Panel>

      <Panel title="Importar / exportar zonas (CSV)" className="mb-6">
        <p className="mb-3 text-xs text-stone-500">Formato: label, zip_prefixes, neighborhoods, delivery_fee, sort_order — use ; para separar CEPs e bairros</p>
        <div className="mb-3">
          <button type="button" onClick={() => void exportCsv()} className="admin-btn-secondary text-sm">Exportar CSV</button>
        </div>
        <textarea className="admin-input min-h-[120px] font-mono text-xs" placeholder="Cole o CSV aqui..." value={csvText} onChange={(e) => setCsvText(e.target.value)} />
        <button type="button" onClick={() => void importCsv()} disabled={!csvText.trim()} className="admin-btn-primary mt-3 disabled:opacity-50">Importar CSV</button>
        {importResult && (
          <p className="mt-2 text-sm text-fresh-700">{importResult.imported} zona(s) importada(s){importResult.errors.length > 0 && ` · ${importResult.errors.length} erro(s)`}</p>
        )}
      </Panel>

      <Panel title="Ponto de saída (rota otimizada)" className="mb-6">
        <p className="mb-4 text-sm text-stone-500">Endereço de onde o entregador parte — usado para calcular a melhor ordem de paradas.</p>
        <form onSubmit={(e) => void saveDepot(e)} className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Rua" className="admin-input sm:col-span-2" value={depotForm.street} onChange={(e) => setDepotForm({ ...depotForm, street: e.target.value })} />
          <input placeholder="Número" className="admin-input" value={depotForm.number} onChange={(e) => setDepotForm({ ...depotForm, number: e.target.value })} />
          <input placeholder="Complemento" className="admin-input" value={depotForm.complement} onChange={(e) => setDepotForm({ ...depotForm, complement: e.target.value })} />
          <input placeholder="Bairro" className="admin-input" value={depotForm.neighborhood} onChange={(e) => setDepotForm({ ...depotForm, neighborhood: e.target.value })} />
          <input placeholder="Cidade" className="admin-input" value={depotForm.city} onChange={(e) => setDepotForm({ ...depotForm, city: e.target.value })} />
          <input placeholder="UF" className="admin-input" maxLength={2} value={depotForm.state} onChange={(e) => setDepotForm({ ...depotForm, state: e.target.value.toUpperCase() })} />
          <input placeholder="CEP" className="admin-input" value={depotForm.zip_code} onChange={(e) => setDepotForm({ ...depotForm, zip_code: e.target.value })} />
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className="admin-btn-primary">Salvar ponto de saída</button>
            {depotSaved && <p className="text-sm text-fresh-700">Endereço salvo e geocodificado.</p>}
          </div>
        </form>
      </Panel>

      <Panel title="PIN do app entregador" className="mb-6">
        <p className="mb-4 text-sm text-stone-500">Login exclusivo em <strong>/entregador</strong> — 4 a 8 dígitos.{driverPinStatus && ' PIN já configurado.'}</p>
        <form onSubmit={(e) => void saveDriverPin(e)} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="admin-label">Novo PIN</label>
            <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={8} className="admin-input w-40" value={driverPin} onChange={(e) => setDriverPin(e.target.value.replace(/\D/g, ''))} />
          </div>
          <button type="submit" disabled={driverPin.length < 4} className="admin-btn-primary disabled:opacity-50">Salvar PIN</button>
          {pinSaved && <span className="text-sm text-fresh-700">PIN atualizado</span>}
        </form>
      </Panel>

      <Panel title="Feriados / bloqueios de entrega">
        <form onSubmit={(e) => void addBlock(e)} className="mb-4 flex flex-wrap gap-2">
          <input required type="date" className="admin-input w-auto" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
          <input placeholder="Motivo (ex: feriado)" className="admin-input flex-1" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
          <button type="submit" className="admin-btn-primary">Bloquear data</button>
        </form>
        <div className="space-y-2">
          {blocks.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-sm">
              <span className="text-stone-800">{b.blockDate.slice(0, 10)} {b.reason && `— ${b.reason}`}</span>
              <button type="button" className="text-sm font-medium text-red-600 hover:text-red-800" onClick={() => void removeBlock(b.id)}>Remover</button>
            </div>
          ))}
        </div>
      </Panel>

      <Modal
        open={showZoneModal}
        onClose={cancelEdit}
        title={editingId ? 'Editar zona de entrega' : 'Nova zona de entrega'}
        subtitle="Defina o nome, CEPs e taxa de entrega."
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={cancelEdit} className="admin-btn-secondary w-full sm:w-auto">Cancelar</button>
            <button type="submit" form="zona-form" className="admin-btn-primary w-full sm:w-auto">
              {editingId ? 'Salvar zona' : 'Adicionar zona'}
            </button>
          </div>
        }
      >
        <form id="zona-form" onSubmit={(e) => void saveZone(e)} className="space-y-4">
          <div>
            <label className="admin-label">Nome da zona</label>
            <input required placeholder="Ex: Zona Central SP" className="admin-input" value={zoneForm.label} onChange={(e) => setZoneForm({ ...zoneForm, label: e.target.value })} />
          </div>
          <div>
            <label className="admin-label">Taxa de entrega (R$)</label>
            <input required type="number" step="0.01" className="admin-input" value={zoneForm.deliveryFee} onChange={(e) => setZoneForm({ ...zoneForm, deliveryFee: e.target.value })} />
          </div>
          <div>
            <label className="admin-label">Prefixos de CEP</label>
            <input required placeholder="010, 011, 012" className="admin-input" value={zoneForm.zipPrefixes} onChange={(e) => setZoneForm({ ...zoneForm, zipPrefixes: e.target.value })} />
            <p className="mt-1 text-xs text-stone-500">Separe por vírgula</p>
          </div>
          <div>
            <label className="admin-label">Bairros (opcional)</label>
            <input placeholder="Centro, Bela Vista" className="admin-input" value={zoneForm.neighborhoods} onChange={(e) => setZoneForm({ ...zoneForm, neighborhoods: e.target.value })} />
          </div>
          <div>
            <label className="admin-label">Prioridade (ordem)</label>
            <input type="number" className="admin-input w-28" value={zoneForm.sortOrder} onChange={(e) => setZoneForm({ ...zoneForm, sortOrder: e.target.value })} />
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
