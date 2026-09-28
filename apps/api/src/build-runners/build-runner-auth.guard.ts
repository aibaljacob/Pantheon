import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BuildRunnersService } from './build-runners.service';
import { Request } from 'express';

export interface AuthenticatedRunner {
  id: string;
  name: string;
  platform: string;
  projectId: string;
}

export interface RunnerRequest extends Request {
  runner: AuthenticatedRunner;
}

@Injectable()
export class BuildRunnerAuthGuard implements CanActivate {
  constructor(private buildRunnersService: BuildRunnersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RunnerRequest>();

    // Header format: X-Runner-Id and X-Runner-Token
    const runnerId = request.headers['x-runner-id'] as string | undefined;
    const runnerToken = request.headers['x-runner-token'] as string | undefined;

    if (!runnerId || !runnerToken) {
      throw new UnauthorizedException('Missing runner credentials');
    }

    const runner = await this.buildRunnersService.validateRunner(
      runnerId,
      runnerToken,
    );

    if (!runner) {
      throw new UnauthorizedException('Invalid runner credentials');
    }

    // Attach authenticated runner info to request for controller to use
    request.runner = {
      id: runner.id,
      name: runner.name,
      platform: runner.platform,
      projectId: runner.projectId,
    };

    return true;
  }
}
