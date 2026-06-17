'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await api<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.access_token);
      router.push('/dashboard');
    } catch {
      setErr('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] bg-[#f4f6f4]">
      <section className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-fresh-700 via-fresh-600 to-emerald-800" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)' }} />
        <div className="relative z-10 p-10">
          <Image src="/logo-header.png" alt="Pomar Fresh" width={797} height={420} className="h-14 w-auto brightness-0 invert" priority />
        </div>
        <div className="relative z-10 p-10 text-white">
          <h1 className="font-display text-4xl font-bold leading-tight">Gestão do Pomar Fresh</h1>
          <p className="mt-4 max-w-md text-lg text-white/85">
            Pedidos, estoque, cardápio e mídia do site — tudo em um só lugar.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/75">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              Acompanhe pedidos e entregas da semana
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              Atualize produtos, combos e banner do site
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              Controle custos e margens de produção
            </li>
          </ul>
        </div>
        <p className="relative z-10 p-10 text-xs text-white/50">© Pomar Fresh · Painel restrito</p>
      </section>

      <section className="flex w-full flex-col justify-center px-5 py-10 safe-top safe-bottom sm:px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden text-center">
            <Image src="/logo-header.png" alt="Pomar Fresh" width={797} height={420} className="mx-auto h-12 w-auto" priority />
            <p className="mt-3 text-sm text-stone-500">Painel administrativo</p>
          </div>

          <div className="admin-card shadow-soft">
            <h2 className="font-display text-2xl font-bold text-stone-900">Entrar no painel</h2>
            <p className="mt-1 text-sm text-stone-500">Use suas credenciais de administrador.</p>

            <form onSubmit={login} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="admin-label">E-mail</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  className="admin-input"
                  placeholder="admin@freshbox.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="admin-label">Senha</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="admin-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {err && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {err}
                </div>
              )}

              <button type="submit" disabled={loading} className="admin-btn-primary w-full disabled:opacity-60">
                {loading ? 'Entrando…' : 'Acessar painel'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-stone-400">
            Problemas para entrar? Fale com o suporte técnico da Innexar.
          </p>
        </div>
      </section>
    </main>
  );
}
