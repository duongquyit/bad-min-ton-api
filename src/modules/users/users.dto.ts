import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import { USER_TYPE } from './users.constants';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(USER_TYPE.INTERNAL)
  @Max(USER_TYPE.GUEST)
  type?: number = USER_TYPE.INTERNAL;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(USER_TYPE.INTERNAL)
  @Max(USER_TYPE.GUEST)
  type?: number;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}

export class ListUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  type?: number;
}
