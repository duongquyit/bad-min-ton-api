import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/database/base.repository';
import { ShuttlecocksTable } from './shuttlecocks.model';

@Injectable()
export class ShuttlecocksRepository extends BaseRepository<ShuttlecocksTable> {
  constructor() {
    super('shuttlecocks');
  }
}
