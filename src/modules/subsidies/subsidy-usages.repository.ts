import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/database/base.repository';
import { SubsidyUsagesTable } from 'src/database/schema';

@Injectable()
export class SubsidyUsagesRepository extends BaseRepository<SubsidyUsagesTable> {
  // subsidy_usages has no deleted_at — append-only log table
  protected readonly softDelete = false;

  constructor() {
    super('subsidy_usages');
  }
}
