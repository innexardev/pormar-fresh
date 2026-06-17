'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PwaPrompt() {
  const [visible, setVisible] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {});

    fetchApi<{ enabled: boolean; public_key: string | null }>('/public/push/vapid-key')
      .then((r) => setPushEnabled(r.enabled && Boolean(r.public_key)))
      .catch(() => {});

    const dismissed = localStorage.getItem('pwa-dismiss');
    if (!dismissed) setVisible(true);
  }, []);

  async function enablePush() {
    try {
      const { public_key } = await fetchApi<{ public_key: string | null }>('/public/push/vapid-key');
      if (!public_key) return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key),
      });
      const json = sub.toJSON();
      await fetch(`${API}/public/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      alert('Notificações ativadas!');
    } catch {
      alert('Não foi possível ativar notificações neste navegador.');
    }
    dismiss();
  }

  function dismiss() {
    localStorage.setItem('pwa-dismiss', '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-fresh-200 bg-white p-4 shadow-lg md:left-auto">
      <p className="text-sm font-medium text-stone-800">Instale o Pomar Fresh</p>
      <p className="mt-1 text-xs text-stone-500">Receba avisos quando seu pedido estiver pronto.</p>
      <div className="mt-3 flex gap-2">
        {pushEnabled && (
          <button type="button" onClick={enablePush} className="rounded-full bg-fresh-600 px-4 py-2 text-xs font-semibold text-white">
            Ativar notificações
          </button>
        )}
        <button type="button" onClick={dismiss} className="text-xs text-stone-400">
          Depois
        </button>
      </div>
    </div>
  );
}
