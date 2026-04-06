import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

export class CreateShuttlecockDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateShuttlecockDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ListShuttlecocksQueryDto extends PaginationQueryDto {}
