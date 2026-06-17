import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../notifications/whatsapp.service';
import { AdminNotifyService } from '../notifications/admin-notify.service';

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) throw new BadRequestException('Telefone invalido');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private whatsapp: WhatsappService,
    private adminNotify: AdminNotifyService,
  ) {}

  async requestOtp(phoneRaw: string) {
    const phone = normalizePhone(phoneRaw);

    const recent = await this.prisma.otpSession.findFirst({
      where: { phone, createdAt: { gte: new Date(Date.now() - 60_000) } },
    });
    if (recent) throw new BadRequestException('Aguarde 60 segundos para solicitar novo codigo');

    await this.prisma.otpSession.deleteMany({ where: { phone } });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60_000);

    await this.prisma.otpSession.create({ data: { phone, code, expiresAt } });
    await this.whatsapp.sendOtp(phone, code);

    return { ok: true, message: 'Codigo enviado via WhatsApp' };
  }

  async verifyOtp(phoneRaw: string, code: string) {
    const phone = normalizePhone(phoneRaw);

    const session = await this.prisma.otpSession.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Codigo expirado');
    }

    if (session.attempts >= 5) {
      throw new UnauthorizedException('Muitas tentativas');
    }

    if (session.code !== code.trim()) {
      await this.prisma.otpSession.update({
        where: { id: session.id },
        data: { attempts: session.attempts + 1 },
      });
      throw new UnauthorizedException('Codigo invalido');
    }

    await this.prisma.otpSession.delete({ where: { id: session.id } });

    let customer = await this.prisma.customer.findFirst({
      where: { OR: [{ phone }, { phone: phoneRaw }] },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { name: 'Cliente', phone: phoneRaw.replace(/\D/g, '').slice(-11) },
      });
      void this.adminNotify.notify('new_customer', {
        nome: customer.name,
        telefone: customer.phone,
      });
    }

    const token = this.jwt.sign(
      { sub: customer.id, role: 'customer', phone: customer.phone },
      { expiresIn: '30d' },
    );

    return {
      access_token: token,
      customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email },
    };
  }

  async getMyOrders(customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: { deliveryWindow: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return orders.map((o) => ({
      order_id: o.id,
      status: o.status,
      total: Number(o.total),
      delivery_date: o.deliveryDate.toISOString().slice(0, 10),
      delivery_label: o.deliveryWindow.label,
      created_at: o.createdAt.toISOString(),
    }));
  }
}
