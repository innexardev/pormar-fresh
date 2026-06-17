import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cardápio',
  description: 'Combos de frutas, legumes e verduras cortados. Escolha seus favoritos e receba 2x por semana.',
  openGraph: {
    title: 'Cardápio | Pomar Fresh',
    description: 'Combos práticos e produtos avulsos por peso e porção.',
  },
};

export default function CardapioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fresh-200 border-t-fresh-500" />
      </div>
    }>
      {children}
    </Suspense>
  );
}
