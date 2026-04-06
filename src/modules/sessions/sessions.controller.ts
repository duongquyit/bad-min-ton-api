import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import {
  AddParticipantDto,
  AddShuttlecockUsageDto,
  CreateSessionDto,
  FinalizeSessionDto,
  ListSessionsQueryDto,
  UpdateSessionDto,
  UpdateShuttlecockUsageDto,
} from './sessions.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // ─── Sessions CRUD ──────────────────────────────────────────────────────────

  @Get()
  async list(@Query() query: ListSessionsQueryDto) {
    const { items, pagination } = await this.sessionsService.list(query);
    return ResponseHelper.list(items, pagination);
  }

  @Post()
  async create(@Body() dto: CreateSessionDto) {
    const session = await this.sessionsService.create(dto);
    return ResponseHelper.created(session);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const session = await this.sessionsService.findById(id);
    return ResponseHelper.ok(session);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    const session = await this.sessionsService.update(id, dto);
    return ResponseHelper.ok(session);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.sessionsService.remove(id);
    return ResponseHelper.noContent();
  }

  // ─── Finalize ────────────────────────────────────────────────────────────────

  @Post(':id/finalize')
  async finalize(@Param('id') id: string, @Body() dto: FinalizeSessionDto) {
    const result = await this.sessionsService.finalize(id, dto);
    return ResponseHelper.ok(result);
  }

  // ─── Participants ────────────────────────────────────────────────────────────

  @Get(':id/participants')
  async listParticipants(@Param('id') id: string) {
    const participants = await this.sessionsService.listParticipants(id);
    return ResponseHelper.ok(participants);
  }

  @Post(':id/participants')
  async addParticipant(@Param('id') id: string, @Body() dto: AddParticipantDto) {
    const participant = await this.sessionsService.addParticipant(id, dto);
    return ResponseHelper.created(participant);
  }

  @Delete(':id/participants/:userId')
  async removeParticipant(@Param('id') id: string, @Param('userId') userId: string) {
    await this.sessionsService.removeParticipant(id, userId);
    return ResponseHelper.noContent();
  }

  // ─── Shuttlecock usage ───────────────────────────────────────────────────────

  @Get(':id/shuttlecocks')
  async listShuttlecockUsage(@Param('id') id: string) {
    const snapshots = await this.sessionsService.listShuttlecockUsage(id);
    return ResponseHelper.ok(snapshots);
  }

  @Post(':id/shuttlecocks')
  async addShuttlecockUsage(@Param('id') id: string, @Body() dto: AddShuttlecockUsageDto) {
    const snapshot = await this.sessionsService.addShuttlecockUsage(id, dto);
    return ResponseHelper.created(snapshot);
  }

  @Patch(':id/shuttlecocks/:snapshotId')
  async updateShuttlecockUsage(
    @Param('id') id: string,
    @Param('snapshotId') snapshotId: string,
    @Body() dto: UpdateShuttlecockUsageDto,
  ) {
    const snapshot = await this.sessionsService.updateShuttlecockUsage(id, snapshotId, dto);
    return ResponseHelper.ok(snapshot);
  }

  @Delete(':id/shuttlecocks/:snapshotId')
  async removeShuttlecockUsage(@Param('id') id: string, @Param('snapshotId') snapshotId: string) {
    await this.sessionsService.removeShuttlecockUsage(id, snapshotId);
    return ResponseHelper.noContent();
  }

  // ─── Payments ────────────────────────────────────────────────────────────────

  @Get(':id/payments')
  async listPayments(@Param('id') id: string) {
    const userSnapshots = await this.sessionsService.listPayments(id);
    return ResponseHelper.ok(userSnapshots);
  }

  @Patch(':id/payments/:userId')
  async markAsPaid(@Param('id') id: string, @Param('userId') userId: string) {
    const userSnapshot = await this.sessionsService.markAsPaid(id, userId);
    return ResponseHelper.ok(userSnapshot);
  }
}
