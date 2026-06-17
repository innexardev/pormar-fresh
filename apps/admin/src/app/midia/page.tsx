'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { ImageUpload } from '@/components/ImageUpload';
import { TextAreaInput, TextInput } from '@/components/FormFields';
import { api, token } from '@/lib/api';

type SiteContent = {
  hero_image_url: string | null;
  hero_fallback_urls: string[];
  home_cards: Array<{ title: string; description: string; image_url: string }>;
};

const DEFAULT_FALLBACKS = [
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
];

const DEFAULT_HOME_CARDS = [
  { title: 'Cortado no dia', description: 'Preparamos no dia da entrega.', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
  { title: '2 entregas/semana', description: 'Terça e sexta.', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80' },
  { title: 'Combos & avulsos', description: 'Monte do seu jeito.', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80' },
];

export default function MidiaPage() {
  const [content, setContent] = useState<SiteContent>({
    hero_image_url: '',
    hero_fallback_urls: DEFAULT_FALLBACKS,
    home_cards: [],
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token()) { window.location.href = '/'; return; }
    api<SiteContent>('/admin/site-content').then((c) => {
      setContent({
        hero_image_url: c.hero_image_url ?? '',
        hero_fallback_urls: c.hero_fallback_urls?.length ? c.hero_fallback_urls : DEFAULT_FALLBACKS,
        home_cards: c.home_cards?.length ? c.home_cards : DEFAULT_HOME_CARDS,
      });
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/admin/site-content', {
        method: 'PATCH',
        body: JSON.stringify({
          heroImageUrl: content.hero_image_url?.trim() || null,
          heroFallbackUrls: content.hero_fallback_urls.filter(Boolean),
          homeCards: content.home_cards,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  function updateCard(i: number, field: string, value: string) {
    const cards = [...content.home_cards];
    cards[i] = { ...cards[i], [field]: value };
    setContent({ ...content, home_cards: cards });
  }

  return (
    <AdminShell>
      <h1 className="mb-2 text-2xl font-bold">Mídia do site</h1>
      <p className="mb-6 text-sm text-gray-500">
        Altere as imagens e clique em <strong>Salvar mídia</strong> no final da página.
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={onSubmit} className="max-w-2xl space-y-8">
        <section className="rounded-xl border-2 border-fresh-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-semibold text-fresh-800">Banner principal (Hero)</h2>
          <p className="mb-4 text-sm text-gray-600">
            Esta é a <strong>primeira imagem grande</strong> no topo do site (onnshoppe.com).
            Recomendado: 1920×1080 px ou maior, horizontal.
          </p>
          <ImageUpload
            folder="site"
            label="Imagem do banner"
            hint="Única imagem exibida no topo do site"
            value={content.hero_image_url ?? ''}
            onChange={(url) => setContent({ ...content, hero_image_url: url })}
          />

          <p className="mb-2 mt-6 text-sm font-medium text-gray-700">Reserva (opcional)</p>
          <p className="mb-3 text-xs text-gray-500">
            Só aparece se a imagem principal não carregar — não vira slide extra.
          </p>
          {content.hero_fallback_urls.slice(0, 1).map((url, i) => (
            <div key={i} className="mb-4">
              <ImageUpload
                folder="site"
                label="Imagem de reserva"
                value={url}
                onChange={(newUrl) => {
                  const urls = [...content.hero_fallback_urls];
                  urls[i] = newUrl;
                  setContent({ ...content, hero_fallback_urls: urls });
                }}
              />
            </div>
          ))}
          {content.hero_fallback_urls.length === 0 && (
            <button
              type="button"
              className="text-sm text-fresh-600"
              onClick={() => setContent({ ...content, hero_fallback_urls: [''] })}
            >
              + imagem de reserva
            </button>
          )}
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Cards da home</h2>
          {content.home_cards.map((card, i) => (
            <div key={i} className="mb-6 space-y-3 rounded-lg border p-4">
              <p className="text-sm font-semibold text-gray-800">Card {i + 1}</p>
              <TextInput label="Título" value={card.title} onChange={(title) => updateCard(i, 'title', title)} />
              <TextAreaInput label="Descrição" rows={2} value={card.description} onChange={(description) => updateCard(i, 'description', description)} />
              <ImageUpload
                folder="site"
                label="Imagem do card"
                hint="Recomendado: 600×400 px ou maior"
                value={card.image_url}
                onChange={(url) => updateCard(i, 'image_url', url)}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-fresh-600"
            onClick={() =>
              setContent({
                ...content,
                home_cards: [...content.home_cards, { title: '', description: '', image_url: '' }],
              })
            }
          >
            + card
          </button>
        </section>

        <div className="sticky bottom-4 rounded-xl border border-fresh-200 bg-white p-4 shadow-lg">
          <button type="submit" className="w-full rounded-lg bg-fresh-600 px-6 py-3 font-semibold text-white sm:w-auto">
            Salvar mídia
          </button>
          {saved && (
            <p className="mt-2 text-sm text-green-600">
              Salvo! Atualize o site (Ctrl+Shift+R em onnshoppe.com) para ver as mudanças.
            </p>
          )}
        </div>
      </form>
    </AdminShell>
  );
}
