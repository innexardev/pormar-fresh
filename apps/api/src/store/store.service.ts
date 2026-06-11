import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  async getPublicInfo() {
    const settings = await this.prisma.storeSettings.findUnique({ where: { id: 'default' } });
    const homeCards = (settings?.homeCardsJson as Array<{ title: string; description: string; image_url: string }> | null) ?? [];
    const heroFallbacks = (settings?.heroFallbackUrls as string[] | null) ?? [];
    return {
      name: settings?.storeName ?? 'Pomar Fresh',
      tagline: settings?.tagline ?? 'Frutas, legumes e verduras frescas — cortados no dia',
      delivery_fee: Number(settings?.deliveryFee ?? 12),
      min_order_value: Number(settings?.minOrderValue ?? 49),
      whatsapp: settings?.whatsapp,
      about: settings?.aboutText,
      delivery_schedule: 'Entregas 2x por semana — tudo cortado no dia da entrega',
      hero_image_url: settings?.heroImageUrl,
      hero_fallback_urls: heroFallbacks,
      home_cards: homeCards,
    };
  }

  async getSiteContent() {
    const settings = await this.prisma.storeSettings.findUnique({ where: { id: 'default' } });
    if (!settings) throw new Error('Store settings not found');
    return {
      hero_image_url: settings.heroImageUrl,
      hero_fallback_urls: (settings.heroFallbackUrls as string[] | null) ?? [],
      home_cards: (settings.homeCardsJson as Array<{ title: string; description: string; image_url: string }> | null) ?? [],
    };
  }

  async updateSiteContent(data: {
    heroImageUrl?: string | null;
    heroFallbackUrls?: string[];
    homeCards?: Array<{ title: string; description: string; image_url: string }>;
  }) {
    return this.prisma.storeSettings.update({
      where: { id: 'default' },
      data: {
        heroImageUrl: data.heroImageUrl,
        heroFallbackUrls: data.heroFallbackUrls,
        homeCardsJson: data.homeCards,
      },
    });
  }
}
