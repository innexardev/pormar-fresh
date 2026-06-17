import { API } from './api';

const DRIVER_TOKEN_KEY = 'driver_token';

export function driverToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DRIVER_TOKEN_KEY);
}

export function setDriverToken(t: string) {
  localStorage.setItem(DRIVER_TOKEN_KEY, t);
}

export function logoutDriver() {
  localStorage.removeItem(DRIVER_TOKEN_KEY);
}

export async function driverApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(driverToken() ? { Authorization: `Bearer ${driverToken()}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    let message = 'Erro na requisicao';
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function driverLogin(pin: string) {
  const res = await fetch(`${API}/driver/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'PIN invalido');
  }
  const data = (await res.json()) as { access_token: string };
  setDriverToken(data.access_token);
  return data;
}

export async function driverUpload(file: File, folder: string) {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  const res = await fetch(`${API}/admin/uploads`, {
    method: 'POST',
    headers: driverToken() ? { Authorization: `Bearer ${driverToken()}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error('Falha no upload');
  return res.json() as Promise<{ url: string }>;
}
