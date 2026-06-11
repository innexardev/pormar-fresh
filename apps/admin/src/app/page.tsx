'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@freshbox.com');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');

  async function login(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.access_token);
      router.push('/dashboard');
    } catch {
      setErr('Credenciais invalidas');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={login} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow">
        <h1 className="text-xl font-bold">Pomar Fresh Admin</h1>
        <input className="w-full rounded border p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="w-full rounded border p-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="w-full rounded bg-fresh-600 py-2 font-semibold text-white">Entrar</button>
      </form>
    </main>
  );
}
