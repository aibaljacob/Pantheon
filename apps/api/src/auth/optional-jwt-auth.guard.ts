import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers['authorization'];

    if (!authorization) {
      request.user = undefined;
      return true;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      request.user = undefined;
      return true;
    }

    try {
      const session = await this.authService.findValidSession(token);
      request.user = session.user;
      request.session = session;
    } catch {
      request.user = undefined;
    }

    return true;
  }
}
