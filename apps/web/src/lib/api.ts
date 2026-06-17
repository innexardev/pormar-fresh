export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    cache: 'no-store',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Erro na requisicao');
  }
  return res.json();
}
