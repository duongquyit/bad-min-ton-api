import { Injectable } from '@nestjs/common';
import { Selectable } from 'kysely';
import {
  BadRequestException,
  ResourceNotFoundException,
} from 'src/common/exceptions/app.exception';
import { PaginationHelper, PaginationMeta } from 'src/common/helpers/pagination.helper';
import { CourtsRepository } from 'src/modules/courts/courts.repository';
import { SubsidiesRepository } from 'src/modules/subsidies/subsidies.repository';
import { SubsidyUsagesRepository } from 'src/modules/subsidies/subsidy-usages.repository';
import { UsersRepository } from 'src/modules/users/users.repository';
import { CalculationEngine, CostStrategy, UserCostBreakdown } from 'src/core/calculation-engine/calculation-engine';
import { SessionParticipantsRepository } from './session-participants.repository';
import { SessionShuttlecockSnapshotsRepository } from './session-shuttlecock-snapshots.repository';
import { SessionSnapshotsRepository } from './session-snapshots.repository';
import { SessionUserSnapshotsRepository } from './session-user-snapshots.repository';
import { SESSION_STATUS } from './sessions.constants';
import {
  AddParticipantDto,
  AddShuttlecockUsageDto,
  CreateSessionDto,
  FinalizeSessionDto,
  ListSessionsQueryDto,
  UpdateSessionDto,
  UpdateShuttlecockUsageDto,
} from './sessions.dto';
import {
  SessionParticipantsTable,
  SessionShuttlecockSnapshotsTable,
  SessionSnapshotsTable,
  SessionUserSnapshotsTable,
  SessionsTable,
} from './sessions.model';
import { SessionsRepository } from './sessions.repository';
import { ShuttlecocksRepository } from 'src/modules/shuttlecocks/shuttlecocks.repository';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionsRepo: SessionsRepository,
    private readonly participantsRepo: SessionParticipantsRepository,
    private readonly shuttlecockSnapshotsRepo: SessionShuttlecockSnapshotsRepository,
    private readonly sessionSnapshotsRepo: SessionSnapshotsRepository,
    private readonly sessionUserSnapshotsRepo: SessionUserSnapshotsRepository,
    private readonly courtsRepo: CourtsRepository,
    private readonly subsidiesRepo: SubsidiesRepository,
    private readonly subsidyUsagesRepo: SubsidyUsagesRepository,
    private readonly usersRepo: UsersRepository,
    private readonly shuttlecocksRepo: ShuttlecocksRepository,
  ) {}

  // ─── Sessions CRUD ──────────────────────────────────────────────────────────

  async list(query: ListSessionsQueryDto): Promise<{ items: Selectable<SessionsTable>[]; pagination: PaginationMeta }> {
    const { page, limit, month, status } = query;
    const [sessions, total] = await Promise.all([
      this.sessionsRepo.findWithFilters({ page, limit, month, status }),
      this.sessionsRepo.countWithFilters({ month, status }),
    ]);
    return { items: sessions, pagination: PaginationHelper.build({ page, limit, total }) };
  }

  async create(dto: CreateSessionDto): Promise<Selectable<SessionsTable>> {
    return this.sessionsRepo.create({
      session_date: dto.session_date,
      court_id: dto.court_id ?? null,
      duration_hours: dto.duration_hours,
      is_scheduled: dto.is_scheduled ?? true,
    });
  }

  async findById(id: string): Promise<SessionDetail> {
    const session = await this.sessionsRepo.findByIdOrThrow(id);
    const [participants, shuttlecocks, snapshot] = await Promise.all([
      this.participantsRepo.findBy('session_id', id),
      this.shuttlecockSnapshotsRepo.findBy('session_id', id),
      this.sessionSnapshotsRepo.findOneBy('session_id', id),
    ]);

    let userSnapshots: Selectable<SessionUserSnapshotsTable>[] = [];
    if (snapshot) {
      userSnapshots = await this.sessionUserSnapshotsRepo.findBy('session_id', id);
    }

    return { ...session, participants, shuttlecocks, snapshot: snapshot ?? null, user_snapshots: userSnapshots };
  }

  async update(id: string, dto: UpdateSessionDto): Promise<Selectable<SessionsTable>> {
    const session = await this.sessionsRepo.findByIdOrThrow(id);
    this.assertDraft(session);
    const updatedSession = await this.sessionsRepo.update(id, {
      ...(dto.session_date && { session_date: dto.session_date }),
      ...(dto.court_id !== undefined && { court_id: dto.court_id }),
      ...(dto.duration_hours !== undefined && { duration_hours: dto.duration_hours }),
    });
    if (!updatedSession) throw new ResourceNotFoundException();
    return updatedSession;
  }

  async remove(id: string): Promise<void> {
    const session = await this.sessionsRepo.findByIdOrThrow(id);
    this.assertDraft(session);
    await this.sessionsRepo.delete(id);
  }

  // ─── Participants ────────────────────────────────────────────────────────────

  async listParticipants(sessionId: string): Promise<ParticipantWithBreakdown[]> {
    const session = await this.sessionsRepo.findByIdOrThrow(sessionId);
    const participants = await this.participantsRepo.findBy('session_id', sessionId);

    if (session.status === SESSION_STATUS.DRAFT) {
      return participants.map((p) => ({ ...p, is_paid: false, paid_at: null, cost_breakdown: null }));
    }

    const [snapshot, userSnapshots] = await Promise.all([
      this.sessionSnapshotsRepo.findOneBy('session_id', sessionId),
      this.sessionUserSnapshotsRepo.findBy('session_id', sessionId),
    ]);

    if (!snapshot) {
      return participants.map((p) => ({ ...p, is_paid: false, paid_at: null, cost_breakdown: null }));
    }

    const courtTotal = snapshot.court_price_snapshot * Number(session.duration_hours);
    const breakdowns = CalculationEngine.buildBreakdown({
      courtTotal,
      shuttlecockTotal: snapshot.shuttlecock_total_amount,
      otherCost: snapshot.other_cost,
      subsidyUsed: snapshot.subsidy_used,
      totalInternal: snapshot.total_internal,
      costStrategy: snapshot.cost_strategy as CostStrategy,
      participants: userSnapshots.map((u) => ({ userId: u.user_id, typeSnapshot: u.type_snapshot })),
    });

    const breakdownMap = new Map(breakdowns.map((b) => [b.user_id, b]));
    const snapshotMap = new Map(userSnapshots.map((u) => [u.user_id, u]));

    return participants.map((p) => ({
      ...p,
      is_paid: snapshotMap.get(p.user_id)?.is_paid ?? false,
      paid_at: snapshotMap.get(p.user_id)?.paid_at ?? null,
      cost_breakdown: breakdownMap.get(p.user_id) ?? null,
    }));
  }

  async addParticipant(
    sessionId: string,
    dto: AddParticipantDto,
  ): Promise<Selectable<SessionParticipantsTable>> {
    const session = await this.sessionsRepo.findByIdOrThrow(sessionId);
    this.assertDraft(session);

    const user = await this.usersRepo.findById(dto.user_id);
    if (!user) throw new ResourceNotFoundException();

    return this.participantsRepo.addParticipant(sessionId, dto.user_id, user.type);
  }

  async removeParticipant(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionsRepo.findByIdOrThrow(sessionId);
    this.assertDraft(session);
    await this.participantsRepo.removeParticipant(sessionId, userId);
  }

  // ─── Shuttlecock usage ───────────────────────────────────────────────────────

  async listShuttlecockUsage(sessionId: string): Promise<Selectable<SessionShuttlecockSnapshotsTable>[]> {
    await this.sessionsRepo.findByIdOrThrow(sessionId);
    return this.shuttlecockSnapshotsRepo.findBy('session_id', sessionId);
  }

  async addShuttlecockUsage(
    sessionId: string,
    dto: AddShuttlecockUsageDto,
  ): Promise<Selectable<SessionShuttlecockSnapshotsTable>> {
    const session = await this.sessionsRepo.findByIdOrThrow(sessionId);
    this.assertDraft(session);

    const shuttlecock = await this.shuttlecocksRepo.findById(dto.shuttlecock_id);
    if (!shuttlecock) throw new ResourceNotFoundException();

    return this.shuttlecockSnapshotsRepo.create({
      session_id: sessionId,
      shuttlecock_id: dto.shuttlecock_id,
      shuttlecock_name_snapshot: shuttlecock.name,
      unit_price_snapshot: shuttlecock.price,
      quantity: dto.quantity,
      total_amount: Math.round((shuttlecock.price / 12) * dto.quantity),
    });
  }

  async updateShuttlecockUsage(
    sessionId: string,
    snapshotId: string,
    dto: UpdateShuttlecockUsageDto,
  ): Promise<Selectable<SessionShuttlecockSnapshotsTable>> {
    const session = await this.sessionsRepo.findByIdOrThrow(sessionId);
    this.assertDraft(session);

    const shuttlecockUsage = await this.shuttlecockSnapshotsRepo.findById(snapshotId);
    if (!shuttlecockUsage) throw new ResourceNotFoundException();

    const updatedUsage = await this.shuttlecockSnapshotsRepo.update(snapshotId, {
      quantity: dto.quantity,
      total_amount: Math.round((shuttlecockUsage.unit_price_snapshot / 12) * dto.quantity),
    });
    if (!updatedUsage) throw new ResourceNotFoundException();
    return updatedUsage;
  }

  async removeShuttlecockUsage(sessionId: string, snapshotId: string): Promise<void> {
    const session = await this.sessionsRepo.findByIdOrThrow(sessionId);
    this.assertDraft(session);

    const shuttlecockUsage = await this.shuttlecockSnapshotsRepo.findById(snapshotId);
    if (!shuttlecockUsage) throw new ResourceNotFoundException();

    await this.shuttlecockSnapshotsRepo.delete(snapshotId);
  }

  // ─── Finalize ────────────────────────────────────────────────────────────────

  async finalize(sessionId: string, dto: FinalizeSessionDto): Promise<FinalizeResult> {
    const session = await this.sessionsRepo.findByIdOrThrow(sessionId);
    this.assertDraft(session);

    const participants = await this.participantsRepo.findBy('session_id', sessionId);
    if (participants.length === 0) throw new BadRequestException();

    const [shuttlecockSnapshots, court] = await Promise.all([
      this.shuttlecockSnapshotsRepo.findBy('session_id', sessionId),
      session.court_id ? this.courtsRepo.findById(session.court_id) : Promise.resolve(null),
    ]);

    const courtRentalCost = (court?.price ?? 0) * Number(session.duration_hours);
    const shuttlecockTotal = shuttlecockSnapshots.reduce((sum, s) => sum + s.total_amount, 0);
    const sessionMonth = toMonthString(session.session_date);

    const subsidy = await this.subsidiesRepo.findByMonth(sessionMonth);
    const subsidyAvailable = subsidy ? subsidy.total_amount - subsidy.used_amount : 0;

    const calculation = CalculationEngine.calculate({
      courtPrice: courtRentalCost,
      shuttlecockTotal,
      otherCost: dto.other_cost ?? 0,
      subsidyAvailable,
      costStrategy: dto.cost_strategy as 1 | 2 | 3,
      participants: participants.map((p) => ({
        userId: p.user_id,
        typeSnapshot: p.type_snapshot,
      })),
    });

    const internalCount = participants.filter((p) => p.type_snapshot === 1).length;
    const guestCount = participants.filter((p) => p.type_snapshot === 2).length;

    const sessionSnapshot = await this.sessionsRepo.withTransaction(async (trx) => {
      const createdSnapshot = await this.sessionSnapshotsRepo.create(
        {
          session_id: sessionId,
          total_participants: participants.length,
          total_internal: internalCount,
          total_guest: guestCount,
          court_id_snapshot: court?.id ?? null,
          court_name_snapshot: court?.name ?? null,
          court_price_snapshot: court?.price ?? 0,
          shuttlecock_total_amount: shuttlecockTotal,
          other_cost: dto.other_cost ?? 0,
          total_cost: calculation.total_cost,
          subsidy_used: calculation.subsidy_used,
          subsidy_remaining_after: calculation.subsidy_remaining,
          cost_strategy: dto.cost_strategy,
          calculation_metadata: JSON.stringify(calculation.metadata),
          note: dto.note ?? null,
        },
        { trx },
      );

      for (const userResult of calculation.per_user) {
        await this.sessionUserSnapshotsRepo.create(
          {
            session_id: sessionId,
            user_id: userResult.user_id,
            type_snapshot: userResult.type_snapshot,
            cost_share: userResult.cost_share,
            subsidy_share: userResult.subsidy_share,
            final_amount: userResult.final_amount,
            is_paid: false,
            paid_at: null,
          },
          { trx },
        );
      }

      if (calculation.subsidy_used > 0 && subsidy) {
        await this.subsidyUsagesRepo.create(
          {
            subsidy_id: subsidy.id,
            session_id: sessionId,
            amount: calculation.subsidy_used,
          },
          { trx },
        );

        await this.subsidiesRepo.update(
          subsidy.id,
          { used_amount: subsidy.used_amount + calculation.subsidy_used },
          { trx },
        );
      }

      await this.sessionsRepo.update(sessionId, { status: SESSION_STATUS.FINALIZED }, { trx });

      return createdSnapshot;
    });

    const userSnapshots = await this.sessionUserSnapshotsRepo.findBy('session_id', sessionId);

    const courtTotal = (court?.price ?? 0) * Number(session.duration_hours);
    const breakdowns = CalculationEngine.buildBreakdown({
      courtTotal,
      shuttlecockTotal,
      otherCost: dto.other_cost ?? 0,
      subsidyUsed: calculation.subsidy_used,
      totalInternal: internalCount,
      costStrategy: dto.cost_strategy as CostStrategy,
      participants: participants.map((p) => ({ userId: p.user_id, typeSnapshot: p.type_snapshot })),
    });

    return {
      snapshot: sessionSnapshot as Selectable<SessionSnapshotsTable>,
      user_snapshots: userSnapshots,
      calculation,
      breakdowns,
    };
  }

  // ─── Payments ────────────────────────────────────────────────────────────────

  async listPayments(sessionId: string): Promise<Selectable<SessionUserSnapshotsTable>[]> {
    const session = await this.sessionsRepo.findByIdOrThrow(sessionId);
    this.assertFinalized(session);
    return this.sessionUserSnapshotsRepo.findBy('session_id', sessionId);
  }

  async markAsPaid(sessionId: string, userId: string): Promise<Selectable<SessionUserSnapshotsTable>> {
    const session = await this.sessionsRepo.findByIdOrThrow(sessionId);
    this.assertFinalized(session);

    const userSnapshots = await this.sessionUserSnapshotsRepo.findAll({
      where: { session_id: sessionId, user_id: userId },
    });
    const userSnapshot = userSnapshots[0];
    if (!userSnapshot) throw new ResourceNotFoundException();

    if (userSnapshot.is_paid) {
      return userSnapshot;
    }

    const updatedUserSnapshot = await this.sessionUserSnapshotsRepo.update(userSnapshot.id, {
      is_paid: true,
      paid_at: new Date(),
    });
    if (!updatedUserSnapshot) throw new ResourceNotFoundException();
    return updatedUserSnapshot;
  }

  // ─── Private guards ──────────────────────────────────────────────────────────

  private assertDraft(session: Selectable<SessionsTable>): void {
    if (session.status !== SESSION_STATUS.DRAFT) {
      throw new BadRequestException();
    }
  }

  private assertFinalized(session: Selectable<SessionsTable>): void {
    if (
      session.status !== SESSION_STATUS.FINALIZED &&
      session.status !== SESSION_STATUS.LOCKED
    ) {
      throw new BadRequestException();
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMonthString(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 7);
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface SessionDetail extends Selectable<SessionsTable> {
  participants: Selectable<SessionParticipantsTable>[];
  shuttlecocks: Selectable<SessionShuttlecockSnapshotsTable>[];
  snapshot: Selectable<SessionSnapshotsTable> | null;
  user_snapshots: Selectable<SessionUserSnapshotsTable>[];
}

export interface ParticipantWithBreakdown extends Selectable<SessionParticipantsTable> {
  is_paid: boolean;
  paid_at: Date | null;
  cost_breakdown: UserCostBreakdown | null;
}

export interface FinalizeResult {
  snapshot: Selectable<SessionSnapshotsTable>;
  user_snapshots: Selectable<SessionUserSnapshotsTable>[];
  calculation: ReturnType<typeof CalculationEngine.calculate>;
  breakdowns: UserCostBreakdown[];
}
