import { Injectable } from '@nestjs/common';
import { Selectable } from 'kysely';
import {
  ResourceConflictException,
  ResourceNotFoundException,
} from 'src/common/exceptions/app.exception';
import { PaginationHelper, PaginationMeta } from 'src/common/helpers/pagination.helper';
import { WriteOptions } from 'src/database/base.repository';
import { CreateSubsidyDto, ListSubsidiesQueryDto, UpdateSubsidyDto } from './subsidies.dto';
import { SubsidiesTable } from './subsidies.model';
import { SubsidiesRepository } from './subsidies.repository';
import { SubsidyUsagesRepository } from './subsidy-usages.repository';

@Injectable()
export class SubsidiesService {
  constructor(
    private readonly subsidiesRepo: SubsidiesRepository,
    private readonly subsidyUsagesRepo: SubsidyUsagesRepository,
  ) {}

  async list({ page, limit }: ListSubsidiesQueryDto): Promise<{ items: Selectable<SubsidiesTable>[]; pagination: PaginationMeta }> {
    const offset = PaginationHelper.toOffset(page, limit);
    const [subsidies, total] = await Promise.all([
      this.subsidiesRepo.findAll({ limit, offset, orderBy: { column: 'month', direction: 'desc' } }),
      this.subsidiesRepo.count(),
    ]);
    return { items: subsidies, pagination: PaginationHelper.build({ page, limit, total }) };
  }

  async create(dto: CreateSubsidyDto): Promise<Selectable<SubsidiesTable>> {
    const existingSubsidy = await this.subsidiesRepo.findByMonth(dto.month);
    if (existingSubsidy) throw new ResourceConflictException();

    return this.subsidiesRepo.create({
      month: `${dto.month}-01`,
      total_amount: dto.total_amount ?? 2000000,
    });
  }

  async findById(id: string): Promise<Selectable<SubsidiesTable>> {
    return this.subsidiesRepo.findByIdOrThrow(id);
  }

  async findByMonth(month: string): Promise<Selectable<SubsidiesTable>> {
    const subsidy = await this.subsidiesRepo.findByMonth(month);
    if (!subsidy) throw new ResourceNotFoundException();
    return subsidy;
  }

  async update(id: string, dto: UpdateSubsidyDto): Promise<Selectable<SubsidiesTable>> {
    const subsidy = await this.subsidiesRepo.update(id, { total_amount: dto.total_amount });
    if (!subsidy) throw new ResourceNotFoundException();
    return subsidy;
  }

  async findByMonthOptional(month: string): Promise<Selectable<SubsidiesTable> | undefined> {
    return this.subsidiesRepo.findByMonth(month);
  }

  async recordUsage(
    subsidyId: string,
    sessionId: string,
    amount: number,
    currentUsedAmount: number,
    options?: WriteOptions,
  ): Promise<void> {
    await this.subsidyUsagesRepo.create(
      { subsidy_id: subsidyId, session_id: sessionId, amount },
      options,
    );
    await this.subsidiesRepo.update(subsidyId, { used_amount: currentUsedAmount + amount }, options);
  }
}
