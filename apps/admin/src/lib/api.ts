export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';

export function token() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(t: string) {
  localStorage.setItem('token', t);
}

export function logout() {
  localStorage.removeItem('token');
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error('Erro na requisicao');
  return res.json();
}
