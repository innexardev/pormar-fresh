const CUSTOMER_TOKEN_KEY = 'customer_token';

export function customerToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerToken(t: string) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, t);
}

export function logoutCustomer() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

export async function customerApi<T>(path: string, init?: RequestInit): Promise<T> {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';
  const res = await fetch(`${API}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(customerToken() ? { Authorization: `Bearer ${customerToken()}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Erro na requisicao');
  }
  return res.json();
}
