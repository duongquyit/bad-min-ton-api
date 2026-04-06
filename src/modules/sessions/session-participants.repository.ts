import { Injectable } from '@nestjs/common';
import { Selectable } from 'kysely';
import { BaseRepository } from 'src/database/base.repository';
import { ResourceConflictException } from 'src/common/exceptions/app.exception';
import { SessionParticipantsTable } from './sessions.model';

@Injectable()
export class SessionParticipantsRepository extends BaseRepository<SessionParticipantsTable> {
  constructor() {
    super('session_participants');
  }

  async addParticipant(
    sessionId: string,
    userId: string,
    typeSnapshot: number,
  ): Promise<Selectable<SessionParticipantsTable>> {
    // Check for any existing record (active or soft-deleted) to handle unique constraint
    const existingParticipant = await this.db
      .selectFrom('session_participants')
      .selectAll()
      .where('session_id', '=', sessionId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (existingParticipant) {
      if (!existingParticipant.deleted_at) {
        throw new ResourceConflictException();
      }
      // Restore soft-deleted participant
      const restoredParticipant = await this.db
        .updateTable('session_participants')
        .set({ deleted_at: null, type_snapshot: typeSnapshot, updated_at: new Date() })
        .where('id', '=', existingParticipant.id)
        .returningAll()
        .executeTakeFirstOrThrow();
      return restoredParticipant as Selectable<SessionParticipantsTable>;
    }

    return this.create({ session_id: sessionId, user_id: userId, type_snapshot: typeSnapshot });
  }

  async removeParticipant(sessionId: string, userId: string): Promise<void> {
    await this.db
      .updateTable('session_participants')
      .set({ deleted_at: new Date() })
      .where('session_id', '=', sessionId)
      .where('user_id', '=', userId)
      .where('deleted_at', 'is', null)
      .execute();
  }
}
