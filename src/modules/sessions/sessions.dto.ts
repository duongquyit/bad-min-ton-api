import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import { COST_STRATEGY, SESSION_STATUS } from './sessions.constants';

export class CreateSessionDto {
  @IsDateString()
  session_date: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  court_id?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  duration_hours: number;

  @IsOptional()
  @Type(() => Boolean)
  is_scheduled?: boolean = true;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsDateString()
  session_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  court_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  duration_hours?: number;
}

export class ListSessionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}

export class AddParticipantDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  user_ids: number[];
}

export class ShuttlecockUsageItemDto {
  @Type(() => Number)
  @IsInt()
  shuttlecock_id: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class AddShuttlecockUsageDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShuttlecockUsageItemDto)
  items: ShuttlecockUsageItemDto[];
}

export class UpdateShuttlecockUsageDto {
  @IsInt()
  @Min(1)
  quantity: number;
}

export class FinalizeSessionDto {
  @IsInt()
  @Min(COST_STRATEGY.EQUAL_SPLIT)
  @Max(COST_STRATEGY.WEIGHTED)
  cost_strategy: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  other_cost?: number = 0;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ListSessionsStatusQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(SESSION_STATUS.DRAFT)
  @Max(SESSION_STATUS.LOCKED)
  status?: number;
}
