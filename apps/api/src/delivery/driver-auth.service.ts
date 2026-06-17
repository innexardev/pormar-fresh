import { Injectable, UnauthorizedException, OnModuleInit, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriverAuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensurePinFromEnv();
  }

  async login(pin: string) {
    const settings = await this.prisma.storeSettings.findUnique({ where: { id: 'default' } });
    const hash = settings?.driverPinHash;
    if (!hash) {
      throw new UnauthorizedException('PIN do entregador nao configurado');
    }
    if (!(await bcrypt.compare(pin, hash))) {
      throw new UnauthorizedException('PIN invalido');
    }

    const token = this.jwt.sign(
      { sub: 'driver', role: 'driver' },
      { expiresIn: this.config.get('DRIVER_JWT_EXPIRES', '12h') },
    );

    return { access_token: token, role: 'driver' };
  }

  async setPin(pin: string) {
    if (!/^\d{4,8}$/.test(pin)) {
      throw new BadRequestException('PIN deve ter 4 a 8 digitos numericos');
    }
    const hash = await bcrypt.hash(pin, 10);
    await this.prisma.storeSettings.update({
      where: { id: 'default' },
      data: { driverPinHash: hash },
    });
    return { ok: true };
  }

  async getPinStatus() {
    const settings = await this.prisma.storeSettings.findUnique({ where: { id: 'default' } });
    return { configured: Boolean(settings?.driverPinHash) };
  }

  async ensurePinFromEnv() {
    const envPin = this.config.get<string>('DRIVER_PIN');
    if (!envPin) return;

    const settings = await this.prisma.storeSettings.findUnique({ where: { id: 'default' } });
    if (settings?.driverPinHash) return;

    await this.setPin(envPin);
  }
}
