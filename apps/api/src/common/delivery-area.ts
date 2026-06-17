export function isZipInDeliveryArea(zipCode: string, prefixes: string[]): boolean {
  if (!prefixes.length) return true;
  const zip = zipCode.replace(/\D/g, '');
  if (zip.length < 5) return false;
  return prefixes.some((p) => zip.startsWith(p.replace(/\D/g, '')));
}

export function parseDeliveryZipPrefixes(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
