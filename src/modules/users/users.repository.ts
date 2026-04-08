import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { BaseRepository } from 'src/database/base.repository';
import { UsersTable } from './users.model';

export interface MemberBreakdownRow {
  user_id: number;
  name: string;
  type: number;
  sessions_attended: string;
  total_paid: string;
  total_owed: string;
}

@Injectable()
export class UsersRepository extends BaseRepository<UsersTable> {
  constructor() {
    super('users');
  }

  async breakdownByDateRange(from: string, to: string): Promise<MemberBreakdownRow[]> {
    return this.db
      .selectFrom('users as u')
      .innerJoin('session_user_snapshots as sus', (join) =>
        join.onRef('sus.user_id', '=', 'u.id').on('sus.deleted_at', 'is', null),
      )
      .innerJoin('sessions as s', (join) =>
        join.onRef('s.id', '=', 'sus.session_id').on('s.deleted_at', 'is', null),
      )
      .select([
        'u.id as user_id',
        'u.name',
        'u.type',
        sql<string>`COUNT(DISTINCT s.id)`.as('sessions_attended'),
        sql<string>`COALESCE(SUM(sus.final_amount) FILTER (WHERE sus.is_paid = true), 0)`.as('total_paid'),
        sql<string>`COALESCE(SUM(sus.final_amount) FILTER (WHERE sus.is_paid = false), 0)`.as('total_owed'),
      ])
      .where('s.session_date', '>=', from)
      .where('s.session_date', '<=', to)
      .where('u.deleted_at', 'is', null)
      .groupBy(['u.id', 'u.name', 'u.type'])
      .orderBy('u.name', 'asc')
      .execute() as Promise<MemberBreakdownRow[]>;
  }
}
