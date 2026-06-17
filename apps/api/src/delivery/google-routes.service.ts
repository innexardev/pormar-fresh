import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeoPoint } from './route-optimizer';

export type GoogleRouteResult = {
  waypoint_order: number[];
  duration_seconds: number;
  distance_meters: number;
  traffic_aware: boolean;
};

@Injectable()
export class GoogleRoutesService {
  private readonly logger = new Logger(GoogleRoutesService.name);

  constructor(private config: ConfigService) {}

  isEnabled(): boolean {
    return Boolean(this.config.get<string>('GOOGLE_MAPS_API_KEY'));
  }

  async computeOptimizedRoute(
    depot: GeoPoint,
    stops: GeoPoint[],
  ): Promise<GoogleRouteResult | null> {
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey || !stops.length) return null;

    const waypoint = (p: GeoPoint) => ({
      location: { latLng: { latitude: p.lat, longitude: p.lng } },
    });

    const body = {
      origin: waypoint(depot),
      destination: waypoint(depot),
      intermediates: stops.map(waypoint),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      optimizeWaypointOrder: true,
      computeAlternativeRoutes: false,
      languageCode: 'pt-BR',
      units: 'METRIC',
    };

    try {
      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'routes.duration,routes.distanceMeters,routes.optimizedIntermediateWaypointIndex',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.warn(`Google Routes API error ${res.status}: ${errText.slice(0, 200)}`);
        return null;
      }

      const data = (await res.json()) as {
        routes?: Array<{
          duration?: string;
          distanceMeters?: number;
          optimizedIntermediateWaypointIndex?: number[];
        }>;
      };

      const route = data.routes?.[0];
      if (!route) return null;

      const durationSec = route.duration ? parseInt(route.duration.replace('s', ''), 10) : 0;

      return {
        waypoint_order: route.optimizedIntermediateWaypointIndex ?? stops.map((_, i) => i),
        duration_seconds: durationSec,
        distance_meters: route.distanceMeters ?? 0,
        traffic_aware: true,
      };
    } catch (err) {
      this.logger.warn(`Google Routes failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async geocode(addressLine: string): Promise<GeoPoint | null> {
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) return null;

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', addressLine);
      url.searchParams.set('key', apiKey);
      url.searchParams.set('region', 'br');

      const res = await fetch(url.toString());
      if (!res.ok) return null;

      const data = (await res.json()) as {
        results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
      };
      const loc = data.results?.[0]?.geometry.location;
      if (!loc) return null;
      return { lat: loc.lat, lng: loc.lng };
    } catch {
      return null;
    }
  }
}
