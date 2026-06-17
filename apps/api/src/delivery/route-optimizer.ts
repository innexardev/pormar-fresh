export type GeoPoint = { lat: number; lng: number };

export type RoutableStop = GeoPoint & { order_id: string };

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Nearest-neighbor heuristic — good enough for ≤30 stops without external API. */
export function optimizeRouteOrder<T extends RoutableStop>(
  depot: GeoPoint,
  stops: T[],
): { ordered: T[]; total_km: number } {
  if (!stops.length) return { ordered: [], total_km: 0 };

  const remaining = [...stops];
  const ordered: T[] = [];
  let current: GeoPoint = depot;
  let totalKm = 0;

  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    totalKm += bestDist;
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    current = next;
  }

  totalKm += haversineKm(current, depot);
  return { ordered, total_km: Math.round(totalKm * 10) / 10 };
}
