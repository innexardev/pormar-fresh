/** Converte texto brasileiro (12,90 / 1.234,56) ou número para decimal JS. */
export function parseDecimal(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = value.trim().replace(/[R$\s]/g, '');
  if (!raw) return null;
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

export function formatCurrency(value: string | number) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const UNIT_LABELS: Record<string, string> = {
  portion: 'Porção',
  kg: 'Kg',
  g: 'Gramas',
  unit: 'Unidade',
};
