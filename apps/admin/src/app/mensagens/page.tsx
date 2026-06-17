'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/AdminUI';
import { api, token } from '@/lib/api';

type Template = {
  key: string;
  label: string;
  body: string;
  active: boolean;
  category: string;
};

type BotOption = {
  id: string;
  trigger: string;
  label: string;
  action: string | null;
  active: boolean;
  sortOrder: number;
};

const TABS = [
  { id: 'transactional', label: 'Pedidos & pagamentos' },
  { id: 'bot', label: 'Menu do bot' },
  { id: 'reminder', label: 'Lembretes' },
  { id: 'admin', label: 'Alertas equipe' },
  { id: 'menu', label: 'Opções do menu' },
] as const;

type TabId = (typeof TABS)[number]['id'] | 'menu';

export default function MensagensPage() {
  const [tab, setTab] = useState<TabId>('transactional');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [botOptions, setBotOptions] = useState<BotOption[]>([]);
  const [editing, setEditing] = useState<Template | null>(null);
  const [body, setBody] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTemplates = (category?: string) =>
    api<Template[]>(`/admin/whatsapp/templates${category ? `?category=${category}` : ''}`).then(setTemplates);

  const loadBot = () => api<BotOption[]>('/admin/bot-menu').then(setBotOptions);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    if (tab === 'menu') loadBot();
    else loadTemplates(tab);
  }, [tab]);

  async function saveTemplate() {
    if (!editing) return;
    setSaving(true);
    try {
      await api(`/admin/whatsapp/templates/${editing.key}`, { method: 'PATCH', body: JSON.stringify({ body }) });
      setEditing(null);
      setMsg('Template salvo!');
      loadTemplates(tab === 'menu' ? undefined : tab);
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function toggleTemplate(key: string, active: boolean) {
    await api(`/admin/whatsapp/templates/${key}`, { method: 'PATCH', body: JSON.stringify({ active: !active }) });
    loadTemplates(tab === 'menu' ? undefined : tab);
  }

  async function toggleBot(id: string, active: boolean) {
    await api(`/admin/bot-menu/${id}`, { method: 'PATCH', body: JSON.stringify({ active: !active }) });
    loadBot();
  }

  function openEdit(t: Template) {
    setEditing(t);
    setBody(t.body);
  }

  return (
    <AdminShell>
      <PageHeader
        title="Mensagens WhatsApp"
        description="Templates automáticos, menu inteligente, lembretes e alertas para a equipe."
      />

      {msg && (
        <div className="mb-4 rounded-xl border border-fresh-200 bg-fresh-50 px-4 py-3 text-sm text-fresh-800">{msg}</div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`chip-filter ${tab === t.id ? 'chip-filter-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'menu' ? (
        <div className="space-y-3">
          <p className="mb-4 text-sm text-stone-500">
            Cliente responde com número ou palavra-chave. Opções 1–5 aparecem no menu principal (*menu*).
          </p>
          {botOptions.map((o) => (
            <div key={o.id} className="admin-card flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-mono font-semibold text-fresh-700">{o.trigger}</span>
                <span className="mx-2 text-stone-300">→</span>
                <span className="text-stone-800">{o.label}</span>
                {o.action && <p className="mt-0.5 text-xs text-stone-400">{o.action}</p>}
              </div>
              <button
                type="button"
                onClick={() => void toggleBot(o.id, o.active)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${o.active ? 'bg-fresh-100 text-fresh-800' : 'bg-stone-100 text-stone-500'}`}
              >
                {o.active ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="mb-2 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 text-xs text-stone-500">
            Variáveis disponíveis: <span className="font-mono">{'{nome}'} {'{pedido}'} {'{total}'} {'{entrega}'} {'{data}'} {'{link}'} {'{pix}'} {'{codigo}'} {'{dias}'} {'{cupom}'} {'{ticket}'}</span>
          </p>
          {templates.map((t) => (
            <div key={t.key} className="admin-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">{t.label}</p>
                  <p className="font-mono text-[11px] text-stone-400">{t.key}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleTemplate(t.key, t.active)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${t.active ? 'bg-fresh-100 text-fresh-800' : 'bg-stone-100 text-stone-500'}`}
                  >
                    {t.active ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary py-1.5 text-xs"
                    onClick={() => openEdit(t)}
                  >
                    Editar
                  </button>
                </div>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700">{t.body}</pre>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.label ?? 'Editar template'}
        subtitle={`Chave: ${editing?.key ?? ''}`}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setEditing(null)} className="admin-btn-secondary w-full sm:w-auto">Cancelar</button>
            <button type="button" onClick={() => void saveTemplate()} disabled={saving} className="admin-btn-primary w-full sm:w-auto disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar template'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-stone-500">
            Variáveis: <span className="font-mono">{'{nome}'} {'{pedido}'} {'{total}'} {'{entrega}'} {'{data}'} {'{link}'} {'{pix}'} {'{codigo}'} {'{dias}'} {'{cupom}'} {'{ticket}'}</span>
          </p>
          <textarea
            className="admin-input min-h-[200px] font-mono text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Corpo da mensagem..."
          />
        </div>
      </Modal>
    </AdminShell>
  );
}
