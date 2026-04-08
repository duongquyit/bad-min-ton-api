import { IsString, Matches } from 'class-validator';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class ReportQueryDto {
  @IsString()
  @Matches(DATE_PATTERN, { message: 'from must be a date in YYYY-MM-DD format' })
  from: string;

  @IsString()
  @Matches(DATE_PATTERN, { message: 'to must be a date in YYYY-MM-DD format' })
  to: string;
}

export interface SpendByCategory {
  court_fees: number;
  shuttlecock_costs: number;
  other_costs: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

export interface MemberBreakdown {
  user_id: string;
  name: string;
  type: 1 | 2;
  sessions_attended: number;
  total_paid: number;
  total_owed: number;
}

export interface ReportData {
  date_range: { from: string; to: string };
  session_count: number;
  total_revenue: number;
  total_expense: number;
  spend_by_category: SpendByCategory;
  monthly_trends: MonthlyTrend[];
  member_breakdown: MemberBreakdown[];
}
