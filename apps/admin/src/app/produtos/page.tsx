'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { api, token } from '@/lib/api';

type Product = {
  id: string;
  name: string;
  unitType: string;
  price: string | number;
  stockQty: string | number;
  minStock: string | number;
  active: boolean;
  weightGrams?: number;
  imageUrl?: string | null;
};

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  const load = () => api<Product[]>('/admin/products').then(setProducts);

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    load();
  }, []);

  async function saveImage(id: string) {
    await api(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ imageUrl: imageUrl || null }),
    });
    setEditing(null);
    load();
  }

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold">Produtos</h1>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left">
            <tr>
              <th className="p-3">Imagem</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Unidade</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Estoque</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-fresh-100 text-xs text-fresh-600">—</div>
                  )}
                </td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.unitType}</td>
                <td className="p-3">R$ {Number(p.price).toFixed(2)}</td>
                <td className="p-3">{Number(p.stockQty)}</td>
                <td className="p-3">
                  {editing === p.id ? (
                    <div className="flex flex-col gap-1">
                      <input
                        className="w-48 rounded border px-2 py-1 text-xs"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="URL da imagem"
                      />
                      <div className="flex gap-1">
                        <button type="button" onClick={() => saveImage(p.id)} className="text-xs text-fresh-600">Salvar</button>
                        <button type="button" onClick={() => setEditing(null)} className="text-xs text-gray-400">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setEditing(p.id); setImageUrl(p.imageUrl ?? ''); }}
                      className="text-fresh-600 hover:underline"
                    >
                      Imagem
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
