'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/lib/api';
import { BOTTOM_NAV, NAV_GROUPS, getPageTitle, isNavActive, type NavItem } from '@/lib/nav';

function NavLink({
  item,
  active,
  onNavigate,
  compact,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition active:scale-[0.98] ${
        active
          ? 'bg-fresh-600 text-white shadow-md shadow-fresh-600/20'
          : 'text-stone-600 hover:bg-white/90 hover:text-fresh-700'
      } ${compact ? 'py-2.5' : ''}`}
    >
      <span className={active ? 'text-white' : 'text-fresh-600'}>{item.icon}</span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function BottomNavItem({ item, active, onMenu }: { item: NavItem; active: boolean; onMenu?: () => void }) {
  if (item.href === '__menu__') {
    return (
      <button
        type="button"
        onClick={onMenu}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold text-stone-500 transition active:scale-95"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
          {item.icon}
        </span>
        Menu
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition active:scale-95 ${
        active ? 'text-fresh-700' : 'text-stone-500'
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-2xl transition ${
          active ? 'bg-fresh-600 text-white shadow-lg shadow-fresh-600/30' : 'bg-transparent text-stone-500'
        }`}
      >
        {item.icon}
      </span>
      {item.shortLabel ?? item.label}
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pageTitle = getPageTitle(path);

  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const menuItem: NavItem = {
    href: '__menu__',
    label: 'Menu',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  };

  return (
    <div className="app-shell min-h-[100dvh] bg-[#f4f6f4] print:block print:min-h-0 print:bg-white">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-fresh-200/50 bg-white/95 backdrop-blur-xl xl:flex">
        <div className="border-b border-fresh-100 px-4 py-5">
          <Link href="/dashboard" className="block">
            <Image src="/logo-header.png" alt="Pomar Fresh" width={797} height={420} className="h-10 w-auto" priority />
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-fresh-700/70">Painel admin</p>
          </Link>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 overscroll-contain">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} active={isNavActive(path, item.href)} compact />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-fresh-100 p-4">
          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-medium text-stone-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.98]"
          >
            Sair da conta
          </button>
        </div>
      </aside>

      {/* Mobile / tablet header */}
      <header className="no-print sticky top-0 z-40 border-b border-fresh-100/80 bg-white/90 backdrop-blur-xl safe-top xl:hidden">
        <div className="flex min-h-14 items-center gap-3 px-4 py-2">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-bold text-stone-900">{pageTitle}</p>
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-fresh-600">Pomar Fresh</p>
          </div>
          <Link href="/dashboard" className="shrink-0">
            <Image src="/logo-header.png" alt="" width={80} height={42} className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="no-print fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm xl:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="no-print fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,320px)] flex-col bg-white shadow-2xl xl:hidden animate-drawer-in safe-top safe-bottom">
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-4">
              <div>
                <p className="font-display text-lg font-bold text-stone-900">Menu</p>
                <p className="text-xs text-stone-500">Navegação completa</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 overscroll-contain">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="mb-6">
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        active={isNavActive(path, item.href)}
                        onNavigate={() => setDrawerOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="border-t border-stone-100 p-4">
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.href = '/';
                }}
                className="w-full rounded-xl bg-red-50 py-3 text-sm font-semibold text-red-700"
              >
                Sair da conta
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main */}
      <main className="app-main min-w-0 px-4 pt-4 sm:px-5 sm:pt-6 xl:ml-64 xl:px-8 xl:pt-8 print:ml-0 print:p-0">
        {children}
      </main>

      {/* Bottom navigation — mobile & tablet */}
      <nav className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200/80 bg-white/95 backdrop-blur-xl safe-bottom xl:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
          {BOTTOM_NAV.map((item) => (
            <BottomNavItem key={item.href} item={item} active={isNavActive(path, item.href)} />
          ))}
          <BottomNavItem item={menuItem} active={false} onMenu={() => setDrawerOpen(true)} />
        </div>
      </nav>
    </div>
  );
}
