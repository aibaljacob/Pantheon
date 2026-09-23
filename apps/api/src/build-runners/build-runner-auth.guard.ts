import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BuildRunnersService } from './build-runners.service';
import { Request } from 'express';

@Injectable()
export class BuildRunnerAuthGuard implements CanActivate {
  constructor(private buildRunnersService: BuildRunnersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Header format: X-Runner-Id and X-Runner-Token
    const runnerId = request.headers['x-runner-id'] as string;
    const runnerToken = request.headers['x-runner-token'] as string;

    if (!runnerId || !runnerToken) {
      throw new UnauthorizedException('Missing runner credentials');
    }

    const isValid = await this.buildRunnersService.validateRunner(runnerId, runnerToken);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid runner credentials');
    }

    // Attach runner info to request for controller to use
    (request as any).runner = { id: runnerId };
    
    return true;
  }
}
