import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CustomerJwtGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser & { role?: string }): TUser {
    if (err || !user) throw new UnauthorizedException('Nao autorizado');
    if (user.role !== 'customer') throw new UnauthorizedException('Acesso apenas para clientes');
    return user;
  }
}

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || user.role !== 'customer') throw new UnauthorizedException();
    return true;
  }
}
