'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/', label: 'Início' },
  { href: '/cardapio', label: 'Cardápio' },
  { href: '/conta', label: 'Minha conta' },
  { href: '/entrega', label: 'Entrega' },
  { href: '/assinatura', label: 'Assinatura' },
];

function SiteLogo() {
  return (
    <Image
      src="/logo-header.png"
      alt="Pomar Fresh"
      width={797}
      height={395}
      priority
      className="h-11 w-auto translate-y-0.5 sm:h-12"
    />
  );
}

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const path = usePathname();
  const active = path === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-fresh-100 text-fresh-700'
          : 'text-stone-600 hover:bg-fresh-100 hover:text-fresh-700'
      }`}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 glass border-b border-fresh-200/50">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Pomar Fresh — início">
          <SiteLogo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex lg:gap-2">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
          <Link
            href="/checkout"
            className="ml-1 rounded-full bg-fresh-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-fresh-600"
          >
            Carrinho
          </Link>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/checkout"
            className="rounded-full bg-fresh-500 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-fresh-600 sm:px-4 sm:py-2 sm:text-sm"
          >
            Carrinho
          </Link>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-stone-600 transition hover:bg-fresh-100 hover:text-fresh-700"
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 top-14 z-40 bg-stone-900/30 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="relative z-50 border-t border-fresh-200/60 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} onClick={() => setMenuOpen(false)} />
              ))}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}

export function SiteFooterLogo() {
  return (
    <Image
      src="/logo2.png"
      alt="Pomar Fresh"
      width={797}
      height={633}
      className="mx-auto h-20 w-auto sm:h-24"
    />
  );
}
