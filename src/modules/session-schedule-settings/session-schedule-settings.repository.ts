import { Injectable } from '@nestjs/common';
import { BaseRepository, WriteOptions } from 'src/database/base.repository';
import type { SessionScheduleSettingsTable } from './session-schedule-settings.model';

@Injectable()
export class SessionScheduleSettingsRepository extends BaseRepository<SessionScheduleSettingsTable> {
  constructor() {
    super('session_schedule_settings');
  }

  async deactivateAllExcept(excludeId: number, options?: WriteOptions): Promise<void> {
    const db = options?.trx ?? this.db;
    await db
      .updateTable('session_schedule_settings')
      .set({ is_active: false, updated_at: new Date() })
      .where('is_active', '=', true)
      .where('id', '!=', excludeId)
      .where('deleted_at', 'is', null)
      .execute();
  }
}
