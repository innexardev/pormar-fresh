'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  driverApi,
  driverLogin,
  driverToken,
  driverUpload,
  logoutDriver,
} from '@/lib/driver-api';

type Stop = {
  stop_number: number;
  order_id: string;
  order_short: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  status_label: string;
  address_line: string;
  maps_url: string;
  waze_url: string;
  distance_from_prev_km?: number;
  items: Array<{ name: string; quantity: number; unit: string }>;
  notes?: string | null;
  total: number;
};

type ChecklistItem = {
  item_index: number;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
};

type RouteData = {
  delivery_date: string;
  stops_count: number;
  route_optimized: boolean;
  route_engine: string;
  total_distance_km: number | null;
  eta_minutes: number | null;
  maps_route_url: string | null;
  stops: Stop[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function EntregadorPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(todayIso());
  const [data, setData] = useState<RouteData | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [gpsOn, setGpsOn] = useState(false);

  useEffect(() => {
    setAuthed(!!driverToken());
  }, []);

  const load = useCallback(async () => {
    const route = await driverApi<RouteData>(`/driver/route?delivery_date=${deliveryDate}`);
    setData(route);
    const lists: Record<string, ChecklistItem[]> = {};
    for (const stop of route.stops) {
      if (stop.status !== 'delivered') {
        const cl = await driverApi<{ items: ChecklistItem[] }>(`/driver/orders/${stop.order_id}/checklist`);
        lists[stop.order_id] = cl.items;
      }
    }
    setChecklists(lists);
  }, [deliveryDate]);

  useEffect(() => {
    if (!authed) return;
    void load();
  }, [authed, load]);

  useEffect(() => {
    if (!authed || !gpsOn) return;
    if (!navigator.geolocation) return;

    const send = (pos: GeolocationPosition) => {
      const active = expanded ?? undefined;
      void driverApi('/driver/location', {
        method: 'POST',
        body: JSON.stringify({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          active_order_id: active,
        }),
      }).catch(() => undefined);
    };

    const watchId = navigator.geolocation.watchPosition(send, () => undefined, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [authed, gpsOn, expanded]);

  const progress = useMemo(() => {
    if (!data) return { done: 0, total: 0 };
    return {
      done: data.stops.filter((s) => s.status === 'delivered').length,
      total: data.stops.length,
    };
  }, [data]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    try {
      await driverLogin(pin);
      setAuthed(true);
      setPin('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Erro ao entrar');
    }
  }

  async function toggleItem(orderId: string, itemIndex: number, checked: boolean) {
    const res = await driverApi<{ items: ChecklistItem[] }>(`/driver/orders/${orderId}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({ item_index: itemIndex, checked }),
    });
    setChecklists((prev) => ({ ...prev, [orderId]: res.items }));
  }

  async function startDelivery(orderId: string) {
    setBusy(orderId);
    setGpsOn(true);
    try {
      const pos = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition((p) => resolve(p), () => resolve(null), { timeout: 8000 });
      });
      await driverApi(`/driver/orders/${orderId}/start`, {
        method: 'POST',
        body: JSON.stringify(
          pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : {},
        ),
      });
      setExpanded(orderId);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function completeDelivery(orderId: string, file?: File) {
    setBusy(orderId);
    try {
      let proofUrl: string | undefined;
      if (file) {
        const uploaded = await driverUpload(file, 'delivery-proof');
        proofUrl = uploaded.url;
      }
      await driverApi(`/driver/orders/${orderId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ proof_url: proofUrl }),
      });
      await load();
      setExpanded(null);
    } finally {
      setBusy(null);
    }
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
          <h1 className="mb-1 text-xl font-bold text-fresh-800">App Entregador</h1>
          <p className="mb-6 text-sm text-stone-500">Digite o PIN da equipe de entrega</p>
          <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder="PIN"
              className="w-full rounded-xl border px-4 py-3 text-center text-2xl tracking-widest"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              autoComplete="one-time-code"
            />
            {loginError && <p className="text-center text-sm text-red-600">{loginError}</p>}
            <button type="submit" className="w-full rounded-xl bg-fresh-600 py-3 font-semibold text-white">
              Entrar
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-stone-400">
            Sem acesso ao painel admin · apenas entregas
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg pb-24">
      <header className="sticky top-0 z-10 border-b border-fresh-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-fresh-800">Entregador</h1>
            <p className="text-xs text-stone-500">
              {data?.route_engine === 'google_traffic' ? 'Rota com trânsito (Google)' : 'Rota otimizada'}
              {gpsOn && ' · GPS ativo'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { logoutDriver(); setAuthed(false); }}
            className="text-xs text-red-600"
          >
            Sair
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <input type="date" className="flex-1 rounded-lg border px-3 py-2 text-sm" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          <button type="button" onClick={() => void load()} className="rounded-lg bg-fresh-600 px-4 py-2 text-sm text-white">OK</button>
        </div>
        {data && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-stone-600">
              <span>{progress.done}/{progress.total} entregues</span>
              <span>
                {data.total_distance_km != null && `~${data.total_distance_km} km`}
                {data.eta_minutes != null && ` · ~${data.eta_minutes} min`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-200">
              <div className="h-full bg-fresh-600 transition-all" style={{ width: progress.total ? `${(progress.done / progress.total) * 100}%` : '0%' }} />
            </div>
          </div>
        )}
      </header>

      {data?.maps_route_url && (
        <div className="border-b bg-blue-50 px-4 py-3">
          <a href={data.maps_route_url} target="_blank" rel="noreferrer" className="block rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white">
            Abrir rota no Google Maps
          </a>
        </div>
      )}

      <div className="space-y-3 p-4">
        {data?.stops.map((stop) => {
          const isOpen = expanded === stop.order_id;
          const items = checklists[stop.order_id] ?? [];
          const allChecked = items.length > 0 && items.every((i) => i.checked);
          const isDelivered = stop.status === 'delivered';
          const isBusy = busy === stop.order_id;

          return (
            <article key={stop.order_id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${isDelivered ? 'border-green-200 opacity-75' : ''}`}>
              <button type="button" className="flex w-full items-start gap-3 p-4 text-left" onClick={() => setExpanded(isOpen ? null : stop.order_id)}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${isDelivered ? 'bg-green-600' : 'bg-fresh-600'}`}>
                  {isDelivered ? '✓' : stop.stop_number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{stop.customer_name}</p>
                  <p className="text-xs text-stone-500">#{stop.order_short} · {stop.status_label}</p>
                  <p className="mt-1 text-sm text-stone-700 line-clamp-2">{stop.address_line}</p>
                </div>
              </button>

              {isOpen && !isDelivered && (
                <div className="border-t px-4 pb-4 pt-2">
                  <ul className="mb-4 space-y-2">
                    {items.map((item) => (
                      <li key={item.item_index} className="flex items-center gap-3 rounded-lg bg-stone-50 px-3 py-2 text-sm">
                        <input type="checkbox" checked={item.checked} onChange={(e) => void toggleItem(stop.order_id, item.item_index, e.target.checked)} className="h-5 w-5" />
                        <span className={item.checked ? 'line-through text-stone-400' : ''}>
                          {item.quantity} {item.unit} — {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mb-3 flex gap-2">
                    <a href={stop.maps_url} target="_blank" rel="noreferrer" className="flex-1 rounded-lg border py-2 text-center text-sm">Maps</a>
                    <a href={stop.waze_url} target="_blank" rel="noreferrer" className="flex-1 rounded-lg border py-2 text-center text-sm">Waze</a>
                  </div>
                  {stop.status !== 'out_for_delivery' && (
                    <button type="button" disabled={isBusy} onClick={() => void startDelivery(stop.order_id)} className="mb-2 w-full rounded-xl border border-fresh-600 py-3 text-sm font-semibold text-fresh-700">
                      Iniciar entrega
                    </button>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="mb-2 w-full text-sm" id={`photo-${stop.order_id}`} />
                  <button
                    type="button"
                    disabled={isBusy || !allChecked}
                    onClick={() => {
                      const input = document.getElementById(`photo-${stop.order_id}`) as HTMLInputElement | null;
                      void completeDelivery(stop.order_id, input?.files?.[0]);
                    }}
                    className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {isBusy ? 'Salvando...' : allChecked ? 'Confirmar entrega' : 'Marque todos os itens'}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="px-4 text-center text-xs text-stone-400">
        <Link href="/entregas" className="underline">Painel admin</Link> (requer login separado)
      </p>
    </main>
  );
}
