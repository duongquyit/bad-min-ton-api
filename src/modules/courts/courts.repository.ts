import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/database/base.repository';
import { CourtsTable } from './courts.model';

@Injectable()
export class CourtsRepository extends BaseRepository<CourtsTable> {
  constructor() {
    super('courts');
  }
}
