'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FALLBACK_IMAGES, sanitizeImageUrl, withMediaCacheBust } from '@/lib/images';

function isMinioMedia(src: string) {
  return src.includes('/media/pomar-fresh/');
}

type Props = {
  tagline?: string;
  storeName?: string;
  heroImage?: string | null;
  heroFallbacks?: string[];
};

export function HeroSection({ tagline, storeName = 'Pomar Fresh', heroImage, heroFallbacks = [] }: Props) {
  const chain = useMemo(() => {
    const list = [
      ...(heroImage?.trim() ? [sanitizeImageUrl(heroImage, '')] : []),
      ...heroFallbacks.filter(Boolean).map((url) => sanitizeImageUrl(url, '')),
      FALLBACK_IMAGES.hero[0],
    ].filter(Boolean);
    return [...new Set(list)];
  }, [heroImage, heroFallbacks]);

  const [activeIndex, setActiveIndex] = useState(0);
  const current = chain[activeIndex] ?? FALLBACK_IMAGES.hero[0];

  function handleError() {
    setActiveIndex((i) => (i + 1 < chain.length ? i + 1 : i));
  }

  return (
    <section className="relative min-h-[72vh] overflow-hidden sm:min-h-[80vh] lg:min-h-[85vh]">
      <div className="absolute inset-0">
        <Image
          key={current}
          src={withMediaCacheBust(current)}
          alt=""
          fill
          priority
          unoptimized={isMinioMedia(current)}
          className="object-cover animate-hero-zoom"
          sizes="100vw"
          onError={handleError}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-fresh-900/80 via-fresh-800/60 to-fresh-700/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-fresh-900/50 to-transparent" />

      <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-center px-4 py-16 sm:min-h-[80vh] sm:py-20 lg:min-h-[85vh] lg:py-24">
        <p className="mb-3 animate-fade-up text-xs font-semibold uppercase tracking-[0.18em] text-fresh-200 sm:mb-4 sm:text-sm sm:tracking-[0.2em]">
          Entrega 2× por semana
        </p>
        <h1 className="max-w-2xl animate-fade-up animate-delay-100 text-3xl font-bold leading-[1.1] text-white sm:text-4xl md:text-6xl lg:text-7xl">
          {storeName}
        </h1>
        <p className="mt-4 max-w-xl animate-fade-up animate-delay-200 text-base text-fresh-100/90 sm:mt-6 sm:text-lg md:text-xl">
          {tagline ?? 'Frutas, legumes e verduras frescas — cortados no dia da entrega'}
        </p>
        <div className="mt-8 flex animate-fade-up animate-delay-300 flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link href="/cardapio" className="btn-primary w-full justify-center sm:w-auto">
            Ver cardápio
          </Link>
          <Link href="/cardapio#combos" className="w-full justify-center rounded-full border-2 border-white/40 px-8 py-3 text-center font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 sm:w-auto">
            Combos da semana
          </Link>
        </div>
      </div>
    </section>
  );
}
