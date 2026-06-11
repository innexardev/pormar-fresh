'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FALLBACK_IMAGES, sanitizeImageUrl } from '@/lib/images';

type Props = {
  tagline?: string;
  storeName?: string;
  heroImage?: string | null;
  heroFallbacks?: string[];
};

export function HeroSection({ tagline, storeName = 'Pomar Fresh', heroImage, heroFallbacks = [] }: Props) {
  const images = useMemo(() => {
    const list = [
      ...(heroImage ? [sanitizeImageUrl(heroImage, FALLBACK_IMAGES.hero[0])] : []),
      ...heroFallbacks.map((url) => sanitizeImageUrl(url, FALLBACK_IMAGES.hero[0])),
      ...FALLBACK_IMAGES.hero,
    ];
    return [...new Set(list)];
  }, [heroImage, heroFallbacks]);

  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const activeImages = images.filter((src) => !failed.has(src));
  const slides = activeImages.length > 0 ? activeImages : FALLBACK_IMAGES.hero;
  const current = slides[index % slides.length] ?? FALLBACK_IMAGES.hero[0];

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  function handleError(src: string) {
    setFailed((prev) => new Set(prev).add(src));
  }

  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      {slides.map((src) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ${src === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={src}
            alt=""
            fill
            priority={src === slides[0]}
            className="object-cover animate-hero-zoom"
            sizes="100vw"
            onError={() => handleError(src)}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-fresh-900/80 via-fresh-800/60 to-fresh-700/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-fresh-900/50 to-transparent" />

      <div className="relative mx-auto flex min-h-[85vh] max-w-6xl flex-col justify-center px-4 py-24">
        <p className="mb-4 animate-fade-up text-sm font-semibold uppercase tracking-[0.2em] text-fresh-200">
          Entrega 2× por semana
        </p>
        <h1 className="max-w-2xl animate-fade-up animate-delay-100 text-4xl font-bold leading-[1.1] text-white md:text-6xl lg:text-7xl">
          {storeName}
        </h1>
        <p className="mt-6 max-w-xl animate-fade-up animate-delay-200 text-lg text-fresh-100/90 md:text-xl">
          {tagline ?? 'Frutas, legumes e verduras frescas — cortados no dia da entrega'}
        </p>
        <div className="mt-10 flex animate-fade-up animate-delay-300 flex-wrap gap-4">
          <Link href="/cardapio" className="btn-primary">
            Ver cardápio
          </Link>
          <Link href="/cardapio#combos" className="rounded-full border-2 border-white/40 px-8 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">
            Combos da semana
          </Link>
        </div>

        {slides.length > 1 && (
          <div className="mt-12 flex gap-2">
            {slides.slice(0, 5).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === index % slides.length ? 'w-8 bg-fresh-300' : 'w-3 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
