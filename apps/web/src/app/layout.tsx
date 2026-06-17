import type { Metadata } from 'next';
import { Outfit, Fraunces } from 'next/font/google';
import './globals.css';
import { PwaPrompt } from '@/components/PwaPrompt';
import { SiteFooterLogo, SiteHeader } from '@/components/SiteHeader';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Pomar Fresh — Frutas e verduras cortadas no dia',
    template: '%s | Pomar Fresh',
  },
  description: 'Combos de frutas, legumes e verduras frescas. Entrega 2x por semana — tudo cortado no dia.',
  keywords: ['hortifruti', 'frutas cortadas', 'verduras', 'delivery', 'São Paulo'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Pomar Fresh',
    title: 'Pomar Fresh — Frutas e verduras cortadas no dia',
    description: 'Combos práticos e produtos avulsos. Entrega terça e sexta.',
  },
  manifest: '/manifest.json',
  robots: { index: true, follow: true },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${fraunces.variable}`}>
      <body>
        <SiteHeader />
        {children}
        <PwaPrompt />
        <footer className="mt-20 border-t border-fresh-200/60 bg-white/60 py-12 text-center backdrop-blur-sm">
          <SiteFooterLogo />
          <p className="mt-2 text-sm text-stone-500">Tudo cortado no dia da entrega · Terça e sexta</p>
        </footer>
      </body>
    </html>
  );
}
