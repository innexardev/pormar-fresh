'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Tab = { id: string; label: string; count: number };

export function CategoryNav({
  tabs,
  active,
  onChange,
  search,
  onSearchChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  search?: string;
  onSearchChange?: (q: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // scroll active tab into view on mobile
  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [active]);

  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-fresh-200/60 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="space-y-3">
        {onSearchChange && (
          <input
            type="search"
            placeholder="Buscar no cardápio..."
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full border border-fresh-200 bg-fresh-50/50 px-4 py-2 text-sm outline-none focus:border-fresh-400"
          />
        )}
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-id={tab.id}
              type="button"
              onClick={() => {
                onChange(tab.id);
                if (tab.id !== 'all') {
                  setTimeout(() => {
                    document.getElementById(`cat-${tab.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 80);
                }
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                active === tab.id
                  ? 'bg-fresh-600 text-white shadow-sm'
                  : 'bg-fresh-50 text-stone-600 hover:bg-fresh-100'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-xs ${active === tab.id ? 'text-fresh-100' : 'text-stone-400'}`}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CategorySidebar({
  tabs,
  search,
  onSearchChange,
}: {
  tabs: Tab[];
  search?: string;
  onSearchChange?: (q: string) => void;
}) {
  const [activeSection, setActiveSection] = useState<string>('all');

  const observe = useCallback(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('cat-', '');
            setActiveSection(id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    for (const tab of tabs) {
      if (tab.id === 'all') continue;
      const el = document.getElementById(`cat-${tab.id}`);
      if (el) observer.observe(el);
    }
    return observer;
  }, [tabs]);

  useEffect(() => {
    const obs = observe();
    return () => obs.disconnect();
  }, [observe]);

  return (
    <aside className="hidden lg:block w-52 shrink-0">
      <div className="sticky top-24 space-y-1">
        {onSearchChange && (
          <input
            type="search"
            placeholder="Buscar..."
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="mb-4 w-full rounded-xl border border-fresh-200 bg-fresh-50/50 px-3 py-2 text-sm outline-none focus:border-fresh-400"
          />
        )}
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-stone-400">Cardápio</p>
        {tabs.map((tab) => {
          const isActive = tab.id === 'all'
            ? activeSection === 'all'
            : activeSection === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'all') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setActiveSection('all');
                } else {
                  document.getElementById(`cat-${tab.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                isActive
                  ? 'bg-fresh-50 text-fresh-700 ring-1 ring-fresh-200'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-xs ${isActive ? 'text-fresh-500' : 'text-stone-400'}`}>{tab.count}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
