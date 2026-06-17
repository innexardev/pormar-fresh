import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from './geocoding.service';
import { GoogleRoutesService } from './google-routes.service';
import { GeoPoint, haversineKm, optimizeRouteOrder } from './route-optimizer';

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  preparing: 'Cortando',
  ready: 'Pronto',
  out_for_delivery: 'Em rota',
  delivered: 'Entregue',
};

function formatAddress(addr: Record<string, string>) {
  const parts = [
    [addr.street, addr.number].filter(Boolean).join(', '),
    addr.complement,
    addr.neighborhood,
    [addr.city, addr.state].filter(Boolean).join(' — '),
    addr.zip_code ? `CEP ${addr.zip_code}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

function buildGoogleMapsRoute(addresses: string[], depotAddress?: string) {
  if (!addresses.length) return null;
  const origin = depotAddress ?? addresses[0];
  const destination = addresses[addresses.length - 1];
  const waypoints = addresses.slice(0, -1).slice(0, 8);
  if (addresses.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  }
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'driving',
  });
  const mid = waypoints.filter((w) => w !== origin && w !== destination);
  if (mid.length) params.set('waypoints', mid.join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export type DeliveryStopPayload = {
  order_id: string;
  order_short: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  status_label: string;
  delivery_label: string;
  neighborhood: string;
  address_line: string;
  lat: number | null;
  lng: number | null;
  maps_url: string;
  waze_url: string;
  items: Array<{ name: string; quantity: number; unit: string }>;
  total: number;
  notes?: string | null;
  delivery_proof_url?: string | null;
  stop_number: number;
  distance_from_prev_km?: number;
};

@Injectable()
export class DeliveryRouteService {
  constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
    private googleRoutes: GoogleRoutesService,
  ) {}

  async getDepot(): Promise<{
    point: GeoPoint | null;
    address_line: string | null;
    address: Record<string, string> | null;
  }> {
    const settings = await this.prisma.storeSettings.findUnique({ where: { id: 'default' } });
    if (!settings) return { point: null, address_line: null, address: null };

    const depotLat = settings.depotLat != null ? Number(settings.depotLat) : null;
    const depotLng = settings.depotLng != null ? Number(settings.depotLng) : null;
    const depotAddr = settings.depotAddressJson as Record<string, string> | null;
    const addressLine = depotAddr ? formatAddress(depotAddr) : null;

    if (depotLat != null && depotLng != null) {
      return { point: { lat: depotLat, lng: depotLng }, address_line: addressLine, address: depotAddr };
    }

    if (addressLine) {
      const geo = await this.geocoding.geocodeAddressLine(addressLine);
      if (geo) {
        await this.prisma.storeSettings.update({
          where: { id: 'default' },
          data: { depotLat: geo.lat, depotLng: geo.lng },
        });
        return { point: { lat: geo.lat, lng: geo.lng }, address_line: addressLine, address: depotAddr };
      }
    }

    return { point: null, address_line: addressLine, address: depotAddr };
  }

  async updateDepot(data: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  }) {
    const addressJson = {
      street: data.street ?? '',
      number: data.number ?? '',
      complement: data.complement ?? '',
      neighborhood: data.neighborhood ?? '',
      city: data.city ?? '',
      state: data.state ?? '',
      zip_code: data.zip_code ?? '',
    };
    const addressLine = formatAddress(addressJson);
    const geo = await this.geocoding.geocodeAddressLine(addressLine);

    return this.prisma.storeSettings.update({
      where: { id: 'default' },
      data: {
        depotAddressJson: addressJson,
        depotLat: geo?.lat ?? null,
        depotLng: geo?.lng ?? null,
      },
    });
  }

  async getRoute(deliveryDate: string, optimize = true) {
    const orders = await this.prisma.order.findMany({
      where: {
        deliveryDate: new Date(deliveryDate),
        status: { in: ['confirmed', 'preparing', 'ready', 'out_for_delivery'] },
      },
      include: { customer: true, deliveryWindow: true, items: true },
      orderBy: { createdAt: 'asc' },
    });

    const depot = await this.getDepot();

    type RawStop = Omit<DeliveryStopPayload, 'stop_number' | 'distance_from_prev_km'> & {
      lat: number | null;
      lng: number | null;
    };

    const rawStops: RawStop[] = [];

    for (const o of orders) {
      const address = o.addressJson as Record<string, string>;
      const addressLine = formatAddress(address);
      const mapsQuery = encodeURIComponent(addressLine);

      let lat: number | null = address.lat != null ? Number(address.lat) : null;
      let lng: number | null = address.lng != null ? Number(address.lng) : null;

      if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        const geo = await this.geocoding.geocodeAddressLine(addressLine, address);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
          if (geo.source !== 'cache') {
            await this.prisma.order.update({
              where: { id: o.id },
              data: { addressJson: { ...address, lat: geo.lat, lng: geo.lng } },
            });
          }
        }
      }

      rawStops.push({
        order_id: o.id,
        order_short: o.id.slice(0, 8).toUpperCase(),
        customer_name: o.customer.name,
        customer_phone: o.customer.phone,
        status: o.status,
        status_label: STATUS_LABEL[o.status] ?? o.status,
        delivery_label: o.deliveryWindow.label,
        neighborhood: address.neighborhood ?? '',
        address_line: addressLine,
        lat,
        lng,
        maps_url: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
        waze_url: `https://waze.com/ul?q=${mapsQuery}&navigate=yes`,
        items: o.items.map((i) => ({
          name: i.itemName,
          quantity: Number(i.quantity),
          unit: i.unitLabel,
        })),
        total: Number(o.total),
        notes: o.notes,
        delivery_proof_url: o.deliveryProofUrl,
      });
    }

    let ordered = rawStops;
    let totalKm = 0;
    let routeOptimized = false;
    let routeEngine: 'google_traffic' | 'nearest_neighbor' | 'none' = 'none';
    let etaMinutes: number | null = null;

    const geocoded = rawStops.filter((s) => s.lat != null && s.lng != null) as Array<
      RawStop & { lat: number; lng: number }
    >;

    if (optimize && geocoded.length >= 2 && depot.point) {
      const googleResult = await this.googleRoutes.computeOptimizedRoute(
        depot.point,
        geocoded.map((s) => ({ lat: s.lat, lng: s.lng })),
      );

      if (googleResult) {
        const orderMap = new Map(rawStops.map((s) => [s.order_id, s]));
        ordered = googleResult.waypoint_order
          .map((i) => geocoded[i])
          .filter(Boolean)
          .map((s) => orderMap.get(s.order_id)!);
        const withoutGeo = rawStops.filter((s) => s.lat == null || s.lng == null);
        ordered = [...ordered, ...withoutGeo];
        totalKm = Math.round(googleResult.distance_meters / 100) / 10;
        etaMinutes = Math.round(googleResult.duration_seconds / 60);
        routeOptimized = true;
        routeEngine = 'google_traffic';
      } else {
        const { ordered: optimized, total_km } = optimizeRouteOrder(
          depot.point,
          geocoded.map((s) => ({ order_id: s.order_id, lat: s.lat, lng: s.lng })),
        );
        const orderMap = new Map(rawStops.map((s) => [s.order_id, s]));
        ordered = optimized.map((o) => orderMap.get(o.order_id)!);
        const withoutGeo = rawStops.filter((s) => s.lat == null || s.lng == null);
        ordered = [...ordered, ...withoutGeo];
        totalKm = total_km;
        routeOptimized = true;
        routeEngine = 'nearest_neighbor';
      }
    } else if (geocoded.length) {
      ordered.sort((a, b) => {
        const byNeighborhood = a.neighborhood.localeCompare(b.neighborhood, 'pt-BR');
        if (byNeighborhood !== 0) return byNeighborhood;
        return a.customer_name.localeCompare(b.customer_name, 'pt-BR');
      });
    }

    let prev: GeoPoint | null = depot.point;
    const stops: DeliveryStopPayload[] = ordered.map((stop, index) => {
      let distanceFromPrev: number | undefined;
      if (prev && stop.lat != null && stop.lng != null) {
        distanceFromPrev = Math.round(haversineKm(prev, { lat: stop.lat, lng: stop.lng }) * 10) / 10;
        prev = { lat: stop.lat, lng: stop.lng };
      }
      return {
        ...stop,
        stop_number: index + 1,
        distance_from_prev_km: distanceFromPrev,
      };
    });

    const mapsRouteUrl = buildGoogleMapsRoute(
      stops.map((s) => s.address_line),
      depot.address_line ?? undefined,
    );

    return {
      delivery_date: deliveryDate,
      stops_count: stops.length,
      route_optimized: routeOptimized,
      route_engine: routeEngine,
      total_distance_km: routeOptimized ? totalKm : null,
      eta_minutes: etaMinutes,
      depot: depot.address_line ? { address_line: depot.address_line, lat: depot.point?.lat, lng: depot.point?.lng } : null,
      stops,
      maps_route_url: mapsRouteUrl,
    };
  }
}
