import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromoService {
  constructor(private prisma: PrismaService) {}

  async validate(code: string, subtotal: Prisma.Decimal | number): Promise<{ discount: Prisma.Decimal; promoCode: string }> {
    const sub = subtotal instanceof Prisma.Decimal ? subtotal : new Prisma.Decimal(subtotal);
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });
    if (!promo?.active) throw new BadRequestException('Cupom invalido');
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new BadRequestException('Cupom expirado');
    }
    if (promo.maxUses != null && promo.usesCount >= promo.maxUses) {
      throw new BadRequestException('Cupom esgotado');
    }
    if (promo.minOrderValue && sub.lt(promo.minOrderValue)) {
      throw new BadRequestException(`Pedido minimo para cupom: R$ ${Number(promo.minOrderValue).toFixed(2)}`);
    }

    let discount: Prisma.Decimal;
    if (promo.discountType === 'percent') {
      discount = sub.mul(promo.discountValue).div(100);
    } else {
      discount = new Prisma.Decimal(promo.discountValue);
    }
    if (discount.gt(sub)) discount = sub;

    return { discount, promoCode: promo.code };
  }

  async applyUse(code: string) {
    await this.prisma.promoCode.update({
      where: { code },
      data: { usesCount: { increment: 1 } },
    });
  }

  listAdmin() {
    return this.prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: {
    code: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    minOrderValue?: number;
    maxUses?: number;
    expiresAt?: string;
  }) {
    return this.prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase().trim(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderValue: data.minOrderValue,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
  }

  update(id: string, data: Partial<{ code: string; discountType: string; discountValue: number; minOrderValue: number; active: boolean; maxUses: number; expiresAt: string | null }>) {
    return this.prisma.promoCode.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code.toUpperCase().trim() }),
        ...(data.discountType !== undefined && { discountType: data.discountType }),
        ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
        ...(data.minOrderValue !== undefined && { minOrderValue: data.minOrderValue }),
        active: data.active,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt === null ? null : data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
  }

  delete(id: string) {
    return this.prisma.promoCode.delete({ where: { id } });
  }
}
