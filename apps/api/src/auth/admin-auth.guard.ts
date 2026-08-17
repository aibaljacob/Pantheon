import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication session required.');
    }

    if (user.role !== 'ADMINISTRATOR') {
      throw new ForbiddenException('Access denied. Administrator privileges required.');
    }

    return true;
  }
}
