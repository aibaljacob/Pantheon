import { Transform } from 'class-transformer';
import {
  IsBoolean,
  Equals,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import {
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_PASSWORD_PATTERN,
  AUTH_USERNAME_PATTERN,
} from './auth.constants';
import { normalizeEmail, normalizeUsername } from './auth.utils';

function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'match',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, arguments_: ValidationArguments) {
          const [relatedPropertyName] = arguments_.constraints;
          return (
            value ===
            (arguments_.object as Record<string, unknown>)[
              relatedPropertyName as string
            ]
          );
        },
      },
    });
  };
}

export class RegisterAuthDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Transform(({ value }) => String(value).trim())
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Transform(({ value }) => String(value).trim())
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  @Matches(AUTH_USERNAME_PATTERN, {
    message:
      'Username can only contain lowercase letters, numbers, dots, underscores, and hyphens.',
  })
  @Transform(({ value }) => normalizeUsername(String(value)))
  username!: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => normalizeEmail(String(value)))
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(AUTH_PASSWORD_MIN_LENGTH, 128)
  @Matches(AUTH_PASSWORD_PATTERN, {
    message:
      'Password must include uppercase, lowercase, number, and special character.',
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @Match('password', { message: 'Passwords do not match.' })
  confirmPassword!: string;

  @IsBoolean()
  @Equals(true, { message: 'You must accept the terms to create an account.' })
  acceptTerms!: boolean;
}

export class LoginAuthDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => normalizeEmail(String(value)))
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class EmailValueDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => normalizeEmail(String(value)))
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @Length(AUTH_PASSWORD_MIN_LENGTH, 128)
  @Matches(AUTH_PASSWORD_PATTERN, {
    message:
      'Password must include uppercase, lowercase, number, and special character.',
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @Match('password', { message: 'Passwords do not match.' })
  confirmPassword!: string;
}

export class VerifyEmailQueryDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class UsernameQueryDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  @Matches(AUTH_USERNAME_PATTERN, {
    message:
      'Username can only contain lowercase letters, numbers, dots, underscores, and hyphens.',
  })
  @Transform(({ value }) => normalizeUsername(String(value)))
  username!: string;
}

export class EmailQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => normalizeEmail(String(value)))
  email!: string;
}
