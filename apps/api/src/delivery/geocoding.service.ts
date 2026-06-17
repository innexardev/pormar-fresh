import { Injectable, Logger } from '@nestjs/common';
import { GoogleRoutesService } from './google-routes.service';

export type GeocodedPoint = { lat: number; lng: number; source: 'cache' | 'google' | 'nominatim' | 'fallback' };

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private lastRequestAt = 0;

  constructor(private google: GoogleRoutesService) {}

  async geocodeAddressLine(addressLine: string, cached?: { lat?: number | string; lng?: number | string }): Promise<GeocodedPoint | null> {
    const lat = cached?.lat != null ? Number(cached.lat) : NaN;
    const lng = cached?.lng != null ? Number(cached.lng) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, source: 'cache' };
    }

    if (this.google.isEnabled()) {
      const google = await this.google.geocode(addressLine);
      if (google) return { ...google, source: 'google' };
    }

    await this.rateLimit();
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', addressLine);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('countrycodes', 'br');

      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'PomarFresh/1.0 (delivery-routing)' },
      });
      if (!res.ok) return null;

      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!data.length) return null;

      return {
        lat: Number(data[0].lat),
        lng: Number(data[0].lon),
        source: 'nominatim',
      };
    } catch (err) {
      this.logger.warn(`Geocoding failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  private async rateLimit() {
    const now = Date.now();
    const wait = 1100 - (now - this.lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastRequestAt = Date.now();
  }
}
