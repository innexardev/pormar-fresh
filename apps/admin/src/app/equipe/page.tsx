'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { PageHeader, Panel } from '@/components/AdminUI';
import { TextInput, NumberInput } from '@/components/FormFields';
import { api, token } from '@/lib/api';

type AdminNotifyEvent =
  | 'new_order'
  | 'new_customer'
  | 'new_subscription'
  | 'payment_received'
  | 'payment_failed'
  | 'support_open'
  | 'order_cancelled';

const EVENT_LABELS: Record<AdminNotifyEvent, string> = {
  new_order: 'Novo pedido',
  new_customer: 'Novo cadastro de cliente',
  new_subscription: 'Nova assinatura',
  payment_received: 'Pagamento recebido',
  payment_failed: 'Erro de pagamento',
  support_open: 'Suporte aberto',
  order_cancelled: 'Pedido cancelado',
};

type Settings = {
  admin_notify_phone_1: string | null;
  admin_notify_phone_2: string | null;
  admin_notify_events: Record<AdminNotifyEvent, boolean>;
  inactivity_reminder_days: number;
  inactivity_reminder_enabled: boolean;
};

export default function EquipePage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [events, setEvents] = useState<Record<AdminNotifyEvent, boolean>>({} as Record<AdminNotifyEvent, boolean>);
  const [reminderDays, setReminderDays] = useState('14');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [msg, setMsg] = useState('');

  const load = () =>
    api<Settings>('/admin/team-notifications').then((s) => {
      setSettings(s);
      setPhone1(s.admin_notify_phone_1 ?? '');
      setPhone2(s.admin_notify_phone_2 ?? '');
      setEvents(s.admin_notify_events);
      setReminderDays(String(s.inactivity_reminder_days));
      setReminderEnabled(s.inactivity_reminder_enabled);
    });

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    await api('/admin/team-notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        admin_notify_phone_1: phone1 || null,
        admin_notify_phone_2: phone2 || null,
        admin_notify_events: events,
        inactivity_reminder_days: Number(reminderDays),
        inactivity_reminder_enabled: reminderEnabled,
      }),
    });
    setMsg('Configurações salvas!');
    load();
    setTimeout(() => setMsg(''), 3000);
  }

  async function runReminders() {
    const res = await api<{ sent: number; skipped: number }>('/admin/engagement/run-reminders', { method: 'POST', body: '{}' });
    alert(`Lembretes enviados: ${res.sent} · Ignorados: ${res.skipped}`);
  }

  if (!settings) return <AdminShell><p className="p-8 text-stone-500">Carregando…</p></AdminShell>;

  return (
    <AdminShell>
      <PageHeader
        title="Equipe & Alertas"
        description="Dois números WhatsApp recebem avisos automáticos da operação. Configure lembretes para clientes inativos."
      />
      {msg && <p className="mb-4 text-sm text-fresh-700">{msg}</p>}

      <form onSubmit={onSave} className="space-y-6">
        <Panel title="Números da equipe administrativa">
          <p className="mb-4 text-sm text-stone-500">
            DDD + número, sem espaços (ex.: 13996189772). Ambos recebem os alertas marcados abaixo.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="WhatsApp equipe 1" value={phone1} onChange={setPhone1} placeholder="13996189772" />
            <TextInput label="WhatsApp equipe 2" value={phone2} onChange={setPhone2} placeholder="11999998888" />
          </div>
        </Panel>

        <Panel title="Eventos que disparam alerta">
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(EVENT_LABELS) as AdminNotifyEvent[]).map((key) => (
              <label key={key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-100 px-3 py-2">
                <input
                  type="checkbox"
                  checked={events[key] ?? false}
                  onChange={() => setEvents({ ...events, [key]: !events[key] })}
                  className="h-4 w-4 rounded border-stone-300 text-fresh-600"
                />
                <span className="text-sm text-stone-700">{EVENT_LABELS[key]}</span>
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Lembretes — clientes que não pedem há um tempo">
          <label className="mb-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={() => setReminderEnabled(!reminderEnabled)}
              className="h-4 w-4 rounded border-stone-300 text-fresh-600"
            />
            <span className="text-sm font-medium text-stone-700">Ativar lembretes automáticos</span>
          </label>
          <NumberInput
            label="Dias sem pedido para enviar lembrete"
            min={7}
            max={90}
            value={reminderDays}
            onChange={setReminderDays}
            suffix="dias"
          />
          <p className="mt-2 text-xs text-stone-400">
            Mensagem editável em Mensagens → categoria &quot;Lembretes&quot; (template reminder_inactive).
          </p>
          <button type="button" onClick={runReminders} className="admin-btn-secondary mt-4">
            Enviar lembretes agora (manual)
          </button>
        </Panel>

        <button type="submit" className="admin-btn-primary">Salvar configurações</button>
      </form>
    </AdminShell>
  );
}
