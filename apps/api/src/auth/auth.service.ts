import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.active || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais invalidas');
    }
    const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return { access_token: token, user: { id: user.id, email: user.email, fullName: user.fullName } };
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET') || 'change-me',
    });
  }
  validate(payload: { sub: string; email?: string; role: string }) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
