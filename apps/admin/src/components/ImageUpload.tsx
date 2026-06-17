'use client';

import { useRef, useState } from 'react';
import { API, token } from '@/lib/api';
import { previewMediaUrl } from '@/lib/media';

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
};

export function ImageUpload({ value, onChange, folder = 'misc', label = 'Imagem', hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [cacheBust, setCacheBust] = useState('1');
  const retriedRef = useRef(false);

  async function handleFile(file: File) {
    setUploading(true);
    setError('');
    setLoadError(false);
    setCacheBust(String(Date.now()));
    retriedRef.current = false;
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', folder);
      const res = await fetch(`${API}/admin/uploads`, {
        method: 'POST',
        headers: token() ? { Authorization: `Bearer ${token()}` } : {},
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Falha no upload');
      }
      const data = (await res.json()) as { url: string };
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
    } finally {
      setUploading(false);
    }
  }

  const previewSrc = value ? previewMediaUrl(value, cacheBust) : '';

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      {value && (
        <div className="relative max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={previewSrc}
            src={previewSrc}
            alt="Preview"
            referrerPolicy="no-referrer"
            className={`h-28 w-full rounded-lg border object-cover ${loadError ? 'opacity-30' : ''}`}
            onLoad={() => { setLoadError(false); retriedRef.current = false; }}
            onError={() => {
              if (!retriedRef.current) {
                retriedRef.current = true;
                setCacheBust(String(Date.now()));
                return;
              }
              setLoadError(true);
            }}
          />
          {loadError && (
            <p className="mt-1 text-xs text-amber-700">
              Não foi possível carregar a imagem. Verifique a URL ou faça upload novamente.
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded border border-fresh-600 px-3 py-1 text-sm text-fresh-700 disabled:opacity-50"
        >
          {uploading ? 'Enviando...' : 'Enviar imagem'}
        </button>
        <input
          className="min-w-0 flex-1 rounded border px-2 py-1 text-sm break-all"
          value={value}
          onChange={(e) => {
            setLoadError(false);
            retriedRef.current = false;
            setCacheBust(String(Date.now()));
            onChange(e.target.value);
          }}
          placeholder="ou cole a URL da imagem"
          title={value}
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
