import { IsString, IsArray, IsOptional, IsDateString } from 'class-validator';

export class CreatePersonalAccessTokenDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
