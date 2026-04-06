import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/database/base.repository';
import { SessionShuttlecockSnapshotsTable } from './sessions.model';

@Injectable()
export class SessionShuttlecockSnapshotsRepository extends BaseRepository<SessionShuttlecockSnapshotsTable> {
  // No deleted_at column — use hard deletes
  protected readonly softDelete = false;

  constructor() {
    super('session_shuttlecock_snapshots');
  }
}
