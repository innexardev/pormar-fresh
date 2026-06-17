import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriverLocationService {
  constructor(private prisma: PrismaService) {}

  async updateLocation(lat: number, lng: number, activeOrderId?: string) {
    return this.prisma.driverLiveState.upsert({
      where: { id: 'default' },
      create: { id: 'default', lat, lng, activeOrderId },
      update: { lat, lng, activeOrderId: activeOrderId ?? undefined },
    });
  }

  async getLiveState() {
    return this.prisma.driverLiveState.findUnique({ where: { id: 'default' } });
  }

  async clearActiveOrder() {
    const state = await this.getLiveState();
    if (!state) return;
    await this.prisma.driverLiveState.update({
      where: { id: 'default' },
      data: { activeOrderId: null },
    });
  }

  /** Public tracking for a specific order */
  async getTrackingForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return null;

    const address = order.addressJson as Record<string, string>;
    const destLat = address.lat != null ? Number(address.lat) : null;
    const destLng = address.lng != null ? Number(address.lng) : null;

    const live = await this.getLiveState();
    const showDriver =
      order.status === 'out_for_delivery' &&
      live?.lat != null &&
      live?.lng != null &&
      live.updatedAt.getTime() > Date.now() - 15 * 60 * 1000;

    const driver =
      showDriver && live?.lat != null && live?.lng != null
        ? {
            lat: Number(live.lat),
            lng: Number(live.lng),
            updated_at: live.updatedAt.toISOString(),
            active_order_id: live.activeOrderId,
          }
        : null;

    return {
      order_id: order.id,
      status: order.status,
      driver,
      destination:
        destLat != null && destLng != null
          ? { lat: destLat, lng: destLng, address_line: this.formatAddress(address) }
          : { address_line: this.formatAddress(address) },
    };
  }

  private formatAddress(addr: Record<string, string>) {
    return [
      [addr.street, addr.number].filter(Boolean).join(', '),
      addr.neighborhood,
      addr.city,
    ]
      .filter(Boolean)
      .join(' · ');
  }
}
