'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pedidos', label: 'Pedidos' },
  { href: '/produtos', label: 'Produtos' },
  { href: '/combos', label: 'Combos' },
  { href: '/midia', label: 'Mídia site' },
  { href: '/estoque', label: 'Estoque' },
  { href: '/custos', label: 'Custos & Preços' },
  { href: '/custos/ingredientes', label: '  ↳ Ingredientes' },
  { href: '/custos/embalagens', label: '  ↳ Embalagens' },
  { href: '/custos/receitas', label: '  ↳ Receitas' },
  { href: '/custos/producao', label: '  ↳ Produção' },
  { href: '/custos/relatorios', label: '  ↳ Relatórios' },
  { href: '/custos/alertas', label: '  ↳ Alertas' },
  { href: '/custos/configuracoes', label: '  ↳ Configurações' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-white border-r p-4">
        <p className="mb-6 font-bold text-fresh-700">Pomar Fresh</p>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`block rounded px-3 py-2 text-sm ${path === n.href ? 'bg-fresh-600 text-white' : 'hover:bg-gray-100'}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => { logout(); window.location.href = '/'; }} className="mt-8 text-sm text-gray-500">
          Sair
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
