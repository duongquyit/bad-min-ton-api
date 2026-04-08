import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { BaseRepository } from 'src/database/base.repository';
import { SessionUserSnapshotsTable } from './sessions.model';

export interface MonthlyIncomeRow {
  month: string;
  income: string;
}

@Injectable()
export class SessionUserSnapshotsRepository extends BaseRepository<SessionUserSnapshotsTable> {
  constructor() {
    super('session_user_snapshots');
  }

  async sumRevenue(from: string, to: string): Promise<string> {
    const row = await this.db
      .selectFrom('session_user_snapshots as sus')
      .innerJoin('sessions as s', 's.id', 'sus.session_id')
      .select(sql<string>`COALESCE(SUM(sus.final_amount), 0)`.as('total_revenue'))
      .where('s.session_date', '>=', from)
      .where('s.session_date', '<=', to)
      .where('sus.is_paid', '=', true)
      .where('s.deleted_at', 'is', null)
      .where('sus.deleted_at', 'is', null)
      .executeTakeFirstOrThrow();

    return row.total_revenue;
  }

  async groupIncomeByMonth(from: string, to: string): Promise<MonthlyIncomeRow[]> {
    return this.db
      .selectFrom('session_user_snapshots as sus')
      .innerJoin('sessions as s', 's.id', 'sus.session_id')
      .select([
        sql<string>`TO_CHAR(s.session_date, 'YYYY-MM')`.as('month'),
        sql<string>`COALESCE(SUM(sus.final_amount) FILTER (WHERE sus.is_paid = true), 0)`.as('income'),
      ])
      .where('s.session_date', '>=', from)
      .where('s.session_date', '<=', to)
      .where('s.deleted_at', 'is', null)
      .where('sus.deleted_at', 'is', null)
      .groupBy(sql`TO_CHAR(s.session_date, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(s.session_date, 'YYYY-MM')`)
      .execute();
  }
}
