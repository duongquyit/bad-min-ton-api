import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

export class CreateSubsidyDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  total_amount?: number = 2000000;
}

export class UpdateSubsidyDto {
  @IsInt()
  @Min(1)
  total_amount: number;
}

export class ListSubsidiesQueryDto extends PaginationQueryDto {}
