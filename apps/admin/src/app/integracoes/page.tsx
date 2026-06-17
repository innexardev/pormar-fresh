'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { PageHeader, Panel } from '@/components/AdminUI';
import { api, token } from '@/lib/api';
import Link from 'next/link';

type Status = {
  minio: boolean;
  asaas: boolean;
  asaas_sandbox: boolean;
  whatsapp: boolean;
  push: boolean;
  delivery_zip_env: boolean;
};

type WaStatus = {
  enabled: boolean;
  connected: boolean;
  state?: string;
  manager_url?: string;
};

type QrResponse = {
  qrcode: string | null;
  pairingCode?: string | null;
  state?: string;
  error?: string;
  managerHint?: string;
};

type WaLog = {
  id: string;
  phone: string;
  templateKey: string | null;
  status: string;
  createdAt: string;
  body: string;
};

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm ${ok ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
      {label}: {ok ? 'Ativo' : 'Desativado'}
    </span>
  );
}

export default function IntegracoesPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [wa, setWa] = useState<WaStatus | null>(null);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrError, setQrError] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [managerUrl, setManagerUrl] = useState('https://evolution.onnshoppe.com/manager');
  const [logs, setLogs] = useState<WaLog[]>([]);
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('Teste Pomar Fresh');

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    api<Status>('/admin/system/status').then(setStatus);
    api<WaStatus>('/admin/whatsapp/status').then((s) => {
      setWa(s);
      if (s.manager_url) setManagerUrl(s.manager_url);
    });
    api<WaLog[]>('/admin/whatsapp/logs').then(setLogs);
  }, []);

  async function loadQr() {
    setQrLoading(true);
    setQrError('');
    try {
      const res = await api<QrResponse>('/admin/whatsapp/qrcode');
      setQrcode(res.qrcode);
      setPairingCode(res.pairingCode ?? null);
      if (res.error) setQrError(res.error);
      if (res.managerHint) setManagerUrl(res.managerHint);
      api<WaStatus>('/admin/whatsapp/status').then(setWa);
    } catch (ex) {
      setQrError(ex instanceof Error ? ex.message : 'Erro ao gerar QR');
    } finally {
      setQrLoading(false);
    }
  }

  async function restartWa() {
    if (!confirm('Reiniciar a instância WhatsApp? Será necessário escanear o QR novamente.')) return;
    const res = await api<{ ok: boolean; message: string }>('/admin/whatsapp/restart', { method: 'POST' });
    alert(res.message);
    setQrcode(null);
    setPairingCode(null);
    api<WaStatus>('/admin/whatsapp/status').then(setWa);
  }

  async function sendTest() {
    await api('/admin/whatsapp/test', {
      method: 'POST',
      body: JSON.stringify({ phone: testPhone, message: testMsg }),
    });
    alert('Mensagem enviada (ou registrada em mock)');
    api<WaLog[]>('/admin/whatsapp/logs').then(setLogs);
  }

  return (
    <AdminShell>
      <PageHeader title="Integrações" description="Status dos serviços e conexão WhatsApp (Evolution API)." />

      {status && (
        <section className="mb-8 flex flex-wrap gap-2">
          <Badge ok={status.minio} label="MinIO" />
          <Badge ok={status.asaas} label="Pix Asaas" />
          <Badge ok={status.whatsapp} label="WhatsApp" />
          <Badge ok={status.push} label="Push PWA" />
          {wa && (
            <span className={`rounded-full px-3 py-1 text-sm ${wa.connected ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              WhatsApp: {wa.connected ? 'Conectado' : wa.state ?? 'Desconectado'}
            </span>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Evolution API — WhatsApp">
          <p className="mb-4 text-sm text-stone-600">
            Escaneie o QR code ou use o painel Evolution. Chave API configurada no servidor.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" onClick={loadQr} disabled={qrLoading} className="admin-btn-primary">
              {qrLoading ? 'Gerando…' : 'Gerar QR Code'}
            </button>
            <button type="button" onClick={restartWa} className="admin-btn-secondary">
              Reiniciar instância
            </button>
            <a href={managerUrl} target="_blank" rel="noreferrer" className="admin-btn-secondary">
              Abrir Manager
            </a>
          </div>
          {qrError && <p className="mb-3 text-sm text-amber-700">{qrError}</p>}
          {pairingCode && (
            <p className="mb-3 rounded-lg bg-stone-100 p-3 text-center font-mono text-lg tracking-widest">{pairingCode}</p>
          )}
          {qrcode && (
            <img
              src={qrcode.startsWith('data:') ? qrcode : `data:image/png;base64,${qrcode}`}
              alt="QR Code WhatsApp"
              className="mx-auto max-w-[260px] rounded-lg border bg-white p-2"
            />
          )}
          <div className="mt-6 space-y-2">
            <input className="admin-input" placeholder="Telefone teste" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
            <input className="admin-input" placeholder="Mensagem" value={testMsg} onChange={(e) => setTestMsg(e.target.value)} />
            <button type="button" onClick={sendTest} className="admin-btn-primary w-full">Enviar teste</button>
          </div>
          <Link href="/mensagens" className="mt-4 inline-block text-sm text-fresh-600">Editar templates de mensagem →</Link>
        </Panel>

        <Panel title="Últimas mensagens">
          <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
            {logs.map((l) => (
              <li key={l.id} className="rounded-lg border border-stone-100 p-3">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>{l.phone}</span>
                  <span>{l.status} · {l.templateKey ?? 'manual'}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-stone-700">{l.body}</p>
              </li>
            ))}
            {logs.length === 0 && <p className="text-stone-400">Nenhuma mensagem ainda.</p>}
          </ul>
        </Panel>
      </div>

      <Panel title="Variáveis de ambiente" className="mt-6">
        <ul className="space-y-2 text-sm text-stone-700">
          <li><strong>WHATSAPP_API_URL</strong> — URL interna Evolution (ex: http://evolution:8080)</li>
          <li><strong>WHATSAPP_API_KEY</strong> — Chave AUTHENTICATION_API_KEY</li>
          <li><strong>WHATSAPP_INSTANCE</strong> — Nome da instância (pomar-fresh)</li>
          <li><strong>NEXT_PUBLIC_SITE_URL</strong> — URL do site para links nos templates</li>
        </ul>
      </Panel>
    </AdminShell>
  );
}
