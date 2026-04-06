import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/database/base.repository';
import { SessionUserSnapshotsTable } from './sessions.model';

@Injectable()
export class SessionUserSnapshotsRepository extends BaseRepository<SessionUserSnapshotsTable> {
  constructor() {
    super('session_user_snapshots');
  }
}
