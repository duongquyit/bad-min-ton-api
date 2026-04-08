import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { BaseRepository } from 'src/database/base.repository';
import { SessionSnapshotsTable } from './sessions.model';

export interface SessionSummaryRow {
  session_count: string;
  total_expense: string;
  court_fees: string;
  shuttlecock_costs: string;
  other_costs: string;
}

export interface MonthlyExpenseRow {
  month: string;
  expense: string;
}

@Injectable()
export class SessionSnapshotsRepository extends BaseRepository<SessionSnapshotsTable> {
  constructor() {
    super('session_snapshots');
  }

  async summarizeByDateRange(from: string, to: string): Promise<SessionSummaryRow> {
    return this.db
      .selectFrom('sessions as s')
      .innerJoin('session_snapshots as ss', 'ss.session_id', 's.id')
      .select([
        sql<string>`COUNT(DISTINCT s.id)`.as('session_count'),
        sql<string>`COALESCE(SUM(ss.total_cost), 0)`.as('total_expense'),
        sql<string>`COALESCE(SUM(ss.court_price_snapshot), 0)`.as('court_fees'),
        sql<string>`COALESCE(SUM(ss.shuttlecock_total_amount), 0)`.as('shuttlecock_costs'),
        sql<string>`COALESCE(SUM(ss.other_cost), 0)`.as('other_costs'),
      ])
      .where('s.session_date', '>=', from)
      .where('s.session_date', '<=', to)
      .where('s.deleted_at', 'is', null)
      .where('ss.deleted_at', 'is', null)
      .executeTakeFirstOrThrow();
  }

  async groupExpensesByMonth(from: string, to: string): Promise<MonthlyExpenseRow[]> {
    return this.db
      .selectFrom('sessions as s')
      .innerJoin('session_snapshots as ss', 'ss.session_id', 's.id')
      .select([
        sql<string>`TO_CHAR(s.session_date, 'YYYY-MM')`.as('month'),
        sql<string>`COALESCE(SUM(ss.total_cost), 0)`.as('expense'),
      ])
      .where('s.session_date', '>=', from)
      .where('s.session_date', '<=', to)
      .where('s.deleted_at', 'is', null)
      .where('ss.deleted_at', 'is', null)
      .groupBy(sql`TO_CHAR(s.session_date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(s.session_date, 'YYYY-MM')`)
      .execute();
  }
}
