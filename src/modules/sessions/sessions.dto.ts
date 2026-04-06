import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import { COST_STRATEGY, SESSION_STATUS } from './sessions.constants';

export class CreateSessionDto {
  @IsDateString()
  session_date: string;

  @IsOptional()
  @IsString()
  court_id?: string;

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
  @IsString()
  court_id?: string;

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
  @IsString()
  user_id: string;
}

export class AddShuttlecockUsageDto {
  @IsString()
  shuttlecock_id: string;

  @IsInt()
  @Min(1)
  quantity: number;
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
