import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MinLength,
  IsEmail,
} from 'class-validator';
import { roles } from '../entities/user.entity';
import { Exclude } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(roles)
  role: roles;
}
