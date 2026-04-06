import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/database/base.repository';
import { SessionSnapshotsTable } from './sessions.model';

@Injectable()
export class SessionSnapshotsRepository extends BaseRepository<SessionSnapshotsTable> {
  constructor() {
    super('session_snapshots');
  }
}
