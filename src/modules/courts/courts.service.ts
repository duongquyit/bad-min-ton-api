import { Injectable } from '@nestjs/common';
import { Selectable } from 'kysely';
import { ResourceNotFoundException } from 'src/common/exceptions/app.exception';
import { PaginationHelper, PaginationMeta } from 'src/common/helpers/pagination.helper';
import { CreateCourtDto, ListCourtsQueryDto, UpdateCourtDto } from './courts.dto';
import { CourtsTable } from './courts.model';
import { CourtsRepository } from './courts.repository';

@Injectable()
export class CourtsService {
  constructor(private readonly courtsRepo: CourtsRepository) {}

  async list({ page, limit }: ListCourtsQueryDto): Promise<{ items: Selectable<CourtsTable>[]; pagination: PaginationMeta }> {
    const offset = PaginationHelper.toOffset(page, limit);
    const [courts, total] = await Promise.all([
      this.courtsRepo.findAll({ limit, offset, orderBy: { column: 'created_at', direction: 'desc' } }),
      this.courtsRepo.count(),
    ]);
    return { items: courts, pagination: PaginationHelper.build({ page, limit, total }) };
  }

  async create(dto: CreateCourtDto): Promise<Selectable<CourtsTable>> {
    return this.courtsRepo.create({
      name: dto.name,
      price: dto.price,
      description: dto.description ?? null,
    });
  }

  async findById(id: string): Promise<Selectable<CourtsTable>> {
    return this.courtsRepo.findByIdOrThrow(id);
  }

  async update(id: string, dto: UpdateCourtDto): Promise<Selectable<CourtsTable>> {
    const court = await this.courtsRepo.update(id, dto);
    if (!court) throw new ResourceNotFoundException();
    return court;
  }

  async remove(id: string): Promise<void> {
    await this.courtsRepo.findByIdOrThrow(id);
    await this.courtsRepo.delete(id);
  }
}
