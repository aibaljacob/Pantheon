import { Controller, Get, Query } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';
import { TaxonomyQueryDto } from './taxonomy.dto';

@Controller('taxonomy')
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get('roles')
  getRoles(@Query() query: TaxonomyQueryDto) {
    return this.taxonomyService.searchRoles(query);
  }

  @Get('specializations')
  getSpecializations(@Query() query: TaxonomyQueryDto) {
    return this.taxonomyService.searchSpecializations(query);
  }

  @Get('skills')
  getSkills(@Query() query: TaxonomyQueryDto) {
    return this.taxonomyService.searchSkills(query);
  }

  @Get('tools')
  getTools(@Query() query: TaxonomyQueryDto) {
    return this.taxonomyService.searchTools(query);
  }

  @Get('game-engines')
  getGameEngines(@Query() query: TaxonomyQueryDto) {
    return this.taxonomyService.searchGameEngines(query);
  }

  @Get('genres')
  getGenres(@Query() query: TaxonomyQueryDto) {
    return this.taxonomyService.searchGenres(query);
  }

  @Get('platforms')
  getPlatforms(@Query() query: TaxonomyQueryDto) {
    return this.taxonomyService.searchPlatforms(query);
  }
}
