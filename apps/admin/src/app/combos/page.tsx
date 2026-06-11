'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

type Combo = {
  id: string;
  name: string;
  price: string | number;
  weightLabel?: string;
  servesPeople?: number;
  active: boolean;
  featured: boolean;
  imageUrl?: string | null;
  items: Array<{ itemName: string; quantity: string | number; unitLabel: string }>;
};

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  const load = () => api<Combo[]>('/admin/combos').then(setCombos);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  async function saveImage(id: string) {
    await api(`/admin/combos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ imageUrl: imageUrl || null }),
    });
    setEditing(null);
    load();
  }

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold">Combos</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {combos.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageUrl} alt={c.name} className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center bg-fresh-50 text-sm text-fresh-400">
                Sem imagem — clique em editar
              </div>
            )}
            <div className="p-5">
              <div className="flex justify-between">
                <h3 className="font-bold">{c.name}</h3>
                {c.featured && <span className="rounded bg-yellow-100 px-2 text-xs">Destaque</span>}
              </div>
              {c.weightLabel && <p className="text-sm text-gray-500">{c.weightLabel}</p>}
              <ul className="my-3 text-sm text-gray-600">
                {c.items.map((i, idx) => (
                  <li key={idx}>• {i.itemName} — {Number(i.quantity)}{i.unitLabel}</li>
                ))}
              </ul>
              <p className="font-bold text-fresh-700">R$ {Number(c.price).toFixed(2)}</p>
              {editing === c.id ? (
                <div className="mt-3 space-y-2">
                  <input
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveImage(c.id)} className="rounded bg-fresh-600 px-3 py-1 text-sm text-white">Salvar</button>
                    <button type="button" onClick={() => setEditing(null)} className="text-sm text-gray-500">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setEditing(c.id); setImageUrl(c.imageUrl ?? ''); }}
                  className="mt-3 text-sm text-fresh-600 hover:underline"
                >
                  Editar imagem
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
