import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { GitHttpService } from './git-http.service';
import { GitBasicAuthGuard } from './git-basic-auth.guard';

@Controller('repos')
@UseGuards(GitBasicAuthGuard)
export class GitHttpController {
  constructor(private readonly gitService: GitHttpService) {}

  @Get(':slug.git/info/refs')
  getInfoRefs(
    @Param('slug') slug: string,
    @Query('service') service: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = (req as any).user;
    const pat = (req as any).pat;
    const runner = (req as any).runner;
    this.gitService.handleInfoRefs(slug, service, user, pat, runner, req, res).catch((err) => {
      console.error('Git HTTP info-refs error:', err);
      res.status(err.status || 500).send(err.message || 'Internal Server Error');
    });
  }

  @Post(':slug.git/git-upload-pack')
  postUploadPack(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = (req as any).user;
    const pat = (req as any).pat;
    const runner = (req as any).runner;
    this.gitService.handleUploadPack(slug, user, pat, runner, req, res).catch((err) => {
      console.error('Git HTTP upload-pack error:', err);
      res.status(err.status || 500).send(err.message || 'Internal Server Error');
    });
  }

  @Post(':slug.git/git-receive-pack')
  postReceivePack(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = (req as any).user;
    const pat = (req as any).pat;
    const runner = (req as any).runner;
    this.gitService.handleReceivePack(slug, user, pat, runner, req, res).catch((err) => {
      console.error('Git HTTP receive-pack error:', err);
      res.status(err.status || 500).send(err.message || 'Internal Server Error');
    });
  }
}
