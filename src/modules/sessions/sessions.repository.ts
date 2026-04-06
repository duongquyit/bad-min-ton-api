import { Injectable } from '@nestjs/common';
import { Selectable, sql } from 'kysely';
import { BaseRepository } from 'src/database/base.repository';
import { PaginationHelper } from 'src/common/helpers/pagination.helper';
import { SessionsTable } from './sessions.model';

@Injectable()
export class SessionsRepository extends BaseRepository<SessionsTable> {
  constructor() {
    super('sessions');
  }

  async findWithFilters({
    page,
    limit,
    month,
    status,
  }: {
    page: number;
    limit: number;
    month?: string;
    status?: number;
  }): Promise<Selectable<SessionsTable>[]> {
    const offset = PaginationHelper.toOffset(page, limit);
    let query = this.db
      .selectFrom('sessions')
      .selectAll()
      .where('deleted_at', 'is', null);

    if (month) {
      query = query.where(sql`TO_CHAR(session_date, 'YYYY-MM')` as any, '=', month);
    }

    if (status !== undefined) {
      query = query.where('status', '=', status);
    }

    query = query.orderBy('session_date', 'desc').limit(limit).offset(offset);
    return (await query.execute()) as Selectable<SessionsTable>[];
  }

  async countWithFilters({ month, status }: { month?: string; status?: number }): Promise<number> {
    let query = this.db
      .selectFrom('sessions')
      .select(sql<string>`COUNT(*)`.as('count'))
      .where('deleted_at', 'is', null);

    if (month) {
      query = query.where(sql`TO_CHAR(session_date, 'YYYY-MM')` as any, '=', month);
    }

    if (status !== undefined) {
      query = query.where('status', '=', status);
    }

    const row = await query.executeTakeFirstOrThrow();
    return Number(row.count);
  }
}
