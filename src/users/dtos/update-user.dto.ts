import { IsString, IsEnum, IsOptional } from 'class-validator';
import { roles } from '../entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @IsEnum(roles)
  @IsOptional()
  role: roles;
}
