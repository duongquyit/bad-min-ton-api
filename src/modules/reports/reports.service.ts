import { Injectable } from '@nestjs/common';
import { SessionsService } from 'src/modules/sessions/sessions.service';
import { UsersService } from 'src/modules/users/users.service';
import { MemberBreakdown, MonthlyTrend, ReportData, ReportQueryDto } from './reports.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
  ) {}

  async generate(query: ReportQueryDto): Promise<ReportData> {
    const { from, to } = query;

    const [summary, totalRevenue, monthlyExpenses, monthlyIncome, memberBreakdownRows] = await Promise.all([
      this.sessionsService.getReportSummary(from, to),
      this.sessionsService.getReportTotalRevenue(from, to),
      this.sessionsService.getReportMonthlyExpenses(from, to),
      this.sessionsService.getReportMonthlyIncome(from, to),
      this.usersService.getMemberBreakdown(from, to),
    ]);

    const monthly_trends = this.mergeMonthlyTrends(monthlyExpenses, monthlyIncome);

    const member_breakdown: MemberBreakdown[] = memberBreakdownRows.map((row) => ({
      user_id: String(row.user_id),
      name: row.name,
      type: row.type as 1 | 2,
      sessions_attended: Number(row.sessions_attended),
      total_paid: Number(row.total_paid),
      total_owed: Number(row.total_owed),
    }));

    return {
      date_range: { from, to },
      session_count: Number(summary.session_count),
      total_revenue: Number(totalRevenue),
      total_expense: Number(summary.total_expense),
      spend_by_category: {
        court_fees: Number(summary.court_fees),
        shuttlecock_costs: Number(summary.shuttlecock_costs),
        other_costs: Number(summary.other_costs),
      },
      monthly_trends,
      member_breakdown,
    };
  }

  private mergeMonthlyTrends(
    expenses: Array<{ month: string; expense: string }>,
    income: Array<{ month: string; income: string }>,
  ): MonthlyTrend[] {
    const monthMap = new Map<string, { income: number; expense: number }>();

    for (const row of expenses) {
      monthMap.set(row.month, { income: 0, expense: Number(row.expense) });
    }

    for (const row of income) {
      const existing = monthMap.get(row.month);
      if (existing) {
        existing.income = Number(row.income);
      } else {
        monthMap.set(row.month, { income: Number(row.income), expense: 0 });
      }
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, income: data.income, expense: data.expense }));
  }
}
