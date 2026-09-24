import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { PersonalAccessTokensService } from './personal-access-tokens.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { CreatePersonalAccessTokenDto } from './personal-access-tokens.dto';

@Controller('auth/personal-access-tokens')
@UseGuards(JwtAuthGuard)
export class PersonalAccessTokensController {
  constructor(private readonly patService: PersonalAccessTokensService) {}

  @Post()
  createToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePersonalAccessTokenDto,
  ) {
    return this.patService.createToken(user.id, dto);
  }

  @Get()
  listTokens(@CurrentUser() user: AuthenticatedUser) {
    return this.patService.listTokens(user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  revokeToken(@CurrentUser() user: AuthenticatedUser, @Param('id') tokenId: string) {
    return this.patService.revokeToken(user.id, tokenId);
  }
}
