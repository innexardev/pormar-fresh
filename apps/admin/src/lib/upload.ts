import { API, token } from './api';

export async function uploadFile(file: File, folder: string): Promise<{ url: string; key: string }> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  const res = await fetch(`${API}/admin/uploads`, {
    method: 'POST',
    headers: token() ? { Authorization: `Bearer ${token()}` } : {},
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Falha no upload');
  }
  return res.json();
}
