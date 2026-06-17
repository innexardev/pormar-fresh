import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DriverJwtGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser & { role?: string }): TUser {
    if (err || !user) throw new UnauthorizedException('Nao autorizado');
    if (user.role !== 'driver') throw new UnauthorizedException('Acesso apenas para entregador');
    return user;
  }
}

@Injectable()
export class AdminOrDriverGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser & { role?: string }): TUser {
    if (err || !user) throw new UnauthorizedException('Nao autorizado');
    const role = user.role;
    if (role !== 'driver' && role !== 'admin' && role !== 'staff') {
      throw new UnauthorizedException('Nao autorizado');
    }
    return user;
  }
}

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedException('Acesso restrito a administradores');
    }
    return true;
  }
}
