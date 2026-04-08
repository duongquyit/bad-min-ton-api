import { Injectable } from '@nestjs/common';
import { Selectable } from 'kysely';
import { ResourceNotFoundException } from 'src/common/exceptions/app.exception';
import { PaginationHelper, PaginationMeta } from 'src/common/helpers/pagination.helper';
import {
  CreateSessionScheduleSettingDto,
  GetActiveScheduleQueryDto,
  ListSessionScheduleSettingsQueryDto,
  UpdateSessionScheduleSettingDto,
} from './session-schedule-settings.dto';
import { SessionScheduleSettingsTable } from './session-schedule-settings.model';
import { SessionScheduleSettingsRepository } from './session-schedule-settings.repository';

@Injectable()
export class SessionScheduleSettingsService {
  constructor(private readonly scheduleRepo: SessionScheduleSettingsRepository) {}

  async list(
    query: ListSessionScheduleSettingsQueryDto,
  ): Promise<{ items: Selectable<SessionScheduleSettingsTable>[]; pagination: PaginationMeta }> {
    const { page, limit } = query;
    const offset = PaginationHelper.toOffset(page, limit);
    const [items, total] = await Promise.all([
      this.scheduleRepo.findAll({ limit, offset, orderBy: { column: 'created_at', direction: 'desc' } }),
      this.scheduleRepo.count(),
    ]);
    return { items, pagination: PaginationHelper.build({ page, limit, total }) };
  }

  async create(
    dto: CreateSessionScheduleSettingDto,
  ): Promise<Selectable<SessionScheduleSettingsTable>> {
    const total_session_of_month = countSessionsInMonth(currentMonthString(), dto.session_day_of_week);

    if (dto.is_active) {
      return this.scheduleRepo.withTransaction(async (trx) => {
        await this.scheduleRepo.deactivateAllExcept(-1, { trx });
        return this.scheduleRepo.create(
          {
            name: dto.name ?? null,
            session_day_of_week: dto.session_day_of_week,
            total_session_of_month,
            is_active: true,
          },
          { trx },
        );
      });
    }

    return this.scheduleRepo.create({
      name: dto.name ?? null,
      session_day_of_week: dto.session_day_of_week,
      total_session_of_month,
      is_active: dto.is_active ?? false,
    });
  }

  async findActive(
    query: GetActiveScheduleQueryDto,
  ): Promise<Selectable<SessionScheduleSettingsTable>> {
    const schedule = await this.scheduleRepo.findOneBy('is_active', true);
    if (!schedule) throw new ResourceNotFoundException();

    const month = query.month ?? currentMonthString();
    const total_session_of_month = countSessionsInMonth(month, schedule.session_day_of_week);

    return { ...schedule, total_session_of_month };
  }

  async update(
    id: number,
    dto: UpdateSessionScheduleSettingDto,
  ): Promise<Selectable<SessionScheduleSettingsTable>> {
    const existing = await this.scheduleRepo.findByIdOrThrow(id);

    const days = dto.session_day_of_week ?? existing.session_day_of_week;
    const patch = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.session_day_of_week !== undefined && {
        session_day_of_week: dto.session_day_of_week,
        total_session_of_month: countSessionsInMonth(currentMonthString(), days),
      }),
      ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      updated_at: new Date(),
    };

    if (dto.is_active === true) {
      return this.scheduleRepo.withTransaction(async (trx) => {
        await this.scheduleRepo.deactivateAllExcept(id, { trx });
        const updated = await this.scheduleRepo.update(id, patch, { trx });
        if (!updated) throw new ResourceNotFoundException();
        return updated;
      });
    }

    const updated = await this.scheduleRepo.update(id, patch);
    if (!updated) throw new ResourceNotFoundException();
    return updated;
  }

  async findActiveForMonth(month: string): Promise<{ total_session_of_month: number } | null> {
    const schedule = await this.scheduleRepo.findOneBy('is_active', true);
    if (!schedule) return null;
    return { total_session_of_month: countSessionsInMonth(month, schedule.session_day_of_week) };
  }

  async remove(id: number): Promise<void> {
    await this.scheduleRepo.findByIdOrThrow(id);
    await this.scheduleRepo.delete(id);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentMonthString(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Count how many times any of the given ISO weekdays (1=Mon … 7=Sun)
 * fall within the calendar month identified by `monthStr` (YYYY-MM).
 */
function countSessionsInMonth(monthStr: string, daysOfWeek: number[]): number {
  const [year, month] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const isoWeekday = date.getDay() === 0 ? 7 : date.getDay();
    if (daysOfWeek.includes(isoWeekday)) {
      count++;
    }
  }
  return count;
}
