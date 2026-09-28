import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers['authorization'];
    let token: string | undefined;

    if (authorization) {
      const [scheme, parsedToken] = authorization.split(' ');
      if (scheme !== 'Bearer' || !parsedToken) {
        throw new UnauthorizedException(
          'Invalid authorization format. Bearer token required.',
        );
      }
      token = parsedToken;
    } else if (
      request.query?.token &&
      typeof request.query.token === 'string'
    ) {
      token = request.query.token;
    }

    if (!token) {
      throw new UnauthorizedException('Authorization header is missing.');
    }

    try {
      const session = await this.authService.findValidSession(token);
      request.user = session.user;
      request.session = session;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Invalid or expired authentication session.',
      );
    }
  }
}
