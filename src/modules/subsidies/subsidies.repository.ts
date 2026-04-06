import { Injectable } from '@nestjs/common';
import { Selectable } from 'kysely';
import { BaseRepository } from 'src/database/base.repository';
import { SubsidiesTable } from './subsidies.model';

@Injectable()
export class SubsidiesRepository extends BaseRepository<SubsidiesTable> {
  constructor() {
    super('subsidies');
  }

  async findByMonth(month: string): Promise<Selectable<SubsidiesTable> | undefined> {
    const monthDate = `${month}-01`;
    const row = await this.db
      .selectFrom('subsidies')
      .selectAll()
      .where('month', '=', monthDate)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return row as Selectable<SubsidiesTable> | undefined;
  }
}
