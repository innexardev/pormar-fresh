'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
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
    await api('/admin/site-content', {
      method: 'PATCH',
      body: JSON.stringify({
        heroImageUrl: content.hero_image_url || null,
        heroFallbackUrls: content.hero_fallback_urls.filter(Boolean),
        homeCards: content.home_cards,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateCard(i: number, field: string, value: string) {
    const cards = [...content.home_cards];
    cards[i] = { ...cards[i], [field]: value };
    setContent({ ...content, home_cards: cards });
  }

  return (
    <AdminShell>
      <h1 className="mb-2 text-2xl font-bold">Mídia do site</h1>
      <p className="mb-6 text-sm text-gray-500">Hero da home e cards com imagens</p>

      <form onSubmit={onSubmit} className="max-w-2xl space-y-8">
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Hero (banner principal)</h2>
          <label className="mb-4 block text-sm">
            <span className="mb-1 block text-gray-600">Imagem principal (URL)</span>
            <input
              className="w-full rounded border px-3 py-2"
              value={content.hero_image_url ?? ''}
              onChange={(e) => setContent({ ...content, hero_image_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
            />
          </label>
          {content.hero_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content.hero_image_url} alt="Preview hero" className="mb-4 h-32 w-full rounded-lg object-cover" />
          )}
          <p className="mb-2 text-sm text-gray-600">Imagens de fallback (rotacionam se principal falhar)</p>
          {content.hero_fallback_urls.map((url, i) => (
            <input
              key={i}
              className="mb-2 w-full rounded border px-3 py-2 text-sm"
              value={url}
              onChange={(e) => {
                const urls = [...content.hero_fallback_urls];
                urls[i] = e.target.value;
                setContent({ ...content, hero_fallback_urls: urls });
              }}
            />
          ))}
          <button
            type="button"
            className="text-sm text-fresh-600"
            onClick={() => setContent({ ...content, hero_fallback_urls: [...content.hero_fallback_urls, ''] })}
          >
            + fallback
          </button>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Cards da home</h2>
          {content.home_cards.map((card, i) => (
            <div key={i} className="mb-6 rounded-lg border p-4">
              <input
                className="mb-2 w-full rounded border px-3 py-2 text-sm font-medium"
                value={card.title}
                onChange={(e) => updateCard(i, 'title', e.target.value)}
                placeholder="Título"
              />
              <textarea
                className="mb-2 w-full rounded border px-3 py-2 text-sm"
                value={card.description}
                onChange={(e) => updateCard(i, 'description', e.target.value)}
                placeholder="Descrição"
                rows={2}
              />
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                value={card.image_url}
                onChange={(e) => updateCard(i, 'image_url', e.target.value)}
                placeholder="URL da imagem"
              />
              {card.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.image_url} alt="" className="mt-2 h-24 w-full rounded object-cover" />
              )}
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

        <button type="submit" className="rounded bg-fresh-600 px-6 py-2 text-white">
          Salvar mídia
        </button>
        {saved && <span className="ml-3 text-sm text-green-600">Salvo!</span>}
      </form>
    </AdminShell>
  );
}
