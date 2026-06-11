import type { Metadata } from 'next';
import { Outfit, Fraunces } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

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
  title: 'Pomar Fresh — Frutas e verduras cortadas no dia',
  description: 'Combos de frutas, legumes e verduras frescas. Entrega 2x por semana.',
};

function Header() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-fresh-200/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl font-bold text-fresh-700">
          Pomar Fresh
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-4">
          <Link href="/" className="rounded-lg px-3 py-2 text-stone-600 transition hover:bg-fresh-100 hover:text-fresh-700">
            Início
          </Link>
          <Link href="/cardapio" className="rounded-lg px-3 py-2 text-stone-600 transition hover:bg-fresh-100 hover:text-fresh-700">
            Cardápio
          </Link>
          <Link href="/checkout" className="rounded-full bg-fresh-500 px-4 py-2 text-white shadow-soft transition hover:bg-fresh-600 hover:shadow-card">
            Carrinho
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${fraunces.variable}`}>
      <body>
        <Header />
        {children}
        <footer className="mt-20 border-t border-fresh-200/60 bg-white/60 py-12 text-center backdrop-blur-sm">
          <p className="font-display text-lg font-semibold text-fresh-700">Pomar Fresh</p>
          <p className="mt-2 text-sm text-stone-500">Tudo cortado no dia da entrega · Terça e sexta</p>
        </footer>
      </body>
    </html>
  );
}
