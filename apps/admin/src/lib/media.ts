/** URL para preview no admin — mantém onnshoppe.com e evita cache 403 da Cloudflare. */
export function previewMediaUrl(url: string, cacheBust?: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    const isOurMedia =
      (parsed.hostname === 'onnshoppe.com' || parsed.hostname.endsWith('.onnshoppe.com')) &&
      parsed.pathname.startsWith('/media/');
    if (!isOurMedia) return url;
    // Não reescreve para admin — img cross-origin sem Origin funciona melhor
    if (cacheBust && !parsed.searchParams.has('t')) {
      parsed.searchParams.set('t', cacheBust);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
