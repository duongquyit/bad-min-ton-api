import { Injectable } from '@nestjs/common';
import { Selectable } from 'kysely';
import { BaseRepository } from 'src/database/base.repository';
import { SessionParticipantsTable } from './sessions.model';

@Injectable()
export class SessionParticipantsRepository extends BaseRepository<SessionParticipantsTable> {
  constructor() {
    super('session_participants');
  }

  async findManyIncludingDeleted(sessionId: number, userIds: number[]): Promise<Selectable<SessionParticipantsTable>[]> {
    return this.db
      .selectFrom('session_participants')
      .selectAll()
      .where('session_id', '=', sessionId)
      .where('user_id', 'in', userIds)
      .execute() as Promise<Selectable<SessionParticipantsTable>[]>;
  }

  async restore(id: number, typeSnapshot: number): Promise<Selectable<SessionParticipantsTable>> {
    return this.db
      .updateTable('session_participants')
      .set({ deleted_at: null, type_snapshot: typeSnapshot, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow() as Promise<Selectable<SessionParticipantsTable>>;
  }

  async removeParticipant(sessionId: number, userId: number): Promise<void> {
    await this.db
      .updateTable('session_participants')
      .set({ deleted_at: new Date() })
      .where('session_id', '=', sessionId)
      .where('user_id', '=', userId)
      .where('deleted_at', 'is', null)
      .execute();
  }
}
