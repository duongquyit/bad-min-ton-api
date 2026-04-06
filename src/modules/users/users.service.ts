import { Injectable } from '@nestjs/common';
import { Selectable } from 'kysely';
import { ResourceNotFoundException } from 'src/common/exceptions/app.exception';
import { PaginationHelper, PaginationMeta } from 'src/common/helpers/pagination.helper';
import { CreateUserDto, ListUsersQueryDto, UpdateUserDto } from './users.dto';
import { UsersTable } from './users.model';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async list({ page, limit, type }: ListUsersQueryDto): Promise<{ items: Selectable<UsersTable>[]; pagination: PaginationMeta }> {
    const offset = PaginationHelper.toOffset(page, limit);
    const where = type !== undefined ? { type } : undefined;
    const [users, total] = await Promise.all([
      this.usersRepo.findAll({
        where,
        limit,
        offset,
        orderBy: { column: 'created_at', direction: 'desc' },
      }),
      this.usersRepo.count(where),
    ]);
    return { items: users, pagination: PaginationHelper.build({ page, limit, total }) };
  }

  async create(dto: CreateUserDto): Promise<Selectable<UsersTable>> {
    return this.usersRepo.create({
      name: dto.name,
      type: dto.type ?? 1,
      avatar_url: dto.avatar_url ?? null,
    });
  }

  async findById(id: string): Promise<Selectable<UsersTable>> {
    return this.usersRepo.findByIdOrThrow(id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<Selectable<UsersTable>> {
    const user = await this.usersRepo.update(id, dto);
    if (!user) throw new ResourceNotFoundException();
    return user;
  }

  async remove(id: string): Promise<void> {
    await this.usersRepo.findByIdOrThrow(id);
    await this.usersRepo.delete(id);
  }
}
