import { Injectable } from '@nestjs/common';
import { Selectable } from 'kysely';
import { ResourceNotFoundException } from 'src/common/exceptions/app.exception';
import { PaginationHelper, PaginationMeta } from 'src/common/helpers/pagination.helper';
import { CreateShuttlecockDto, ListShuttlecocksQueryDto, UpdateShuttlecockDto } from './shuttlecocks.dto';
import { ShuttlecocksTable } from './shuttlecocks.model';
import { ShuttlecocksRepository } from './shuttlecocks.repository';

@Injectable()
export class ShuttlecocksService {
  constructor(private readonly shuttlecocksRepo: ShuttlecocksRepository) {}

  async list({ page, limit }: ListShuttlecocksQueryDto): Promise<{ items: Selectable<ShuttlecocksTable>[]; pagination: PaginationMeta }> {
    const offset = PaginationHelper.toOffset(page, limit);
    const [shuttlecocks, total] = await Promise.all([
      this.shuttlecocksRepo.findAll({ limit, offset, orderBy: { column: 'created_at', direction: 'desc' } }),
      this.shuttlecocksRepo.count(),
    ]);
    return { items: shuttlecocks, pagination: PaginationHelper.build({ page, limit, total }) };
  }

  async create(dto: CreateShuttlecockDto): Promise<Selectable<ShuttlecocksTable>> {
    return this.shuttlecocksRepo.create({
      name: dto.name,
      price: dto.price,
      quantity: dto.quantity,
      description: dto.description ?? null,
    });
  }

  async findById(id: number): Promise<Selectable<ShuttlecocksTable>> {
    return this.shuttlecocksRepo.findByIdOrThrow(id);
  }

  async update(id: number, dto: UpdateShuttlecockDto): Promise<Selectable<ShuttlecocksTable>> {
    const shuttlecock = await this.shuttlecocksRepo.update(id, dto);
    if (!shuttlecock) throw new ResourceNotFoundException();
    return shuttlecock;
  }

  async remove(id: number): Promise<void> {
    await this.shuttlecocksRepo.findByIdOrThrow(id);
    await this.shuttlecocksRepo.delete(id);
  }
}
