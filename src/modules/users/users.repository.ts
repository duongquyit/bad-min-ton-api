import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/database/base.repository';
import { UsersTable } from './users.model';

@Injectable()
export class UsersRepository extends BaseRepository<UsersTable> {
  constructor() {
    super('users');
  }
}
