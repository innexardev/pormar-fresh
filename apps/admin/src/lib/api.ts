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
  if (!res.ok) {
    let message = 'Erro na requisicao';
    try {
      const body = await res.json();
      message = body.message ?? body.error ?? message;
      if (Array.isArray(body.message)) message = body.message.join(', ');
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}
