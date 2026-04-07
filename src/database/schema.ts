import type { ColumnType, Generated } from 'kysely';

// Columns managed exclusively by the DB on insert (DEFAULT now()) that the
// application can update but never set on insert.
type UpdateableTimestamp = ColumnType<Date, never, Date>;
// Nullable soft-delete column: unset on insert, writable on update.
type SoftDeleteTimestamp = ColumnType<Date | null, never, Date | null>;
// Column that has a DB default on insert AND can be updated by the application.
type DefaultableNumber<T extends number = number> = ColumnType<T, T | undefined, T>;
type DefaultableBoolean = ColumnType<boolean, boolean | undefined, boolean>;

// =====================================================
// USERS
// type: 1 = internal, 2 = guest
// =====================================================
export interface UsersTable {
  id: Generated<number>;
  name: string;
  avatar_url: string | null;
  type: DefaultableNumber;
  created_at: Generated<Date>;
  updated_at: UpdateableTimestamp;
  deleted_at: SoftDeleteTimestamp;
}

// =====================================================
// COURTS
// =====================================================
export interface CourtsTable {
  id: Generated<number>;
  name: string;
  description: string | null;
  price: number;
  created_at: Generated<Date>;
  updated_at: UpdateableTimestamp;
  deleted_at: SoftDeleteTimestamp;
}

// =====================================================
// SHUTTLECOCKS
// =====================================================
export interface ShuttlecocksTable {
  id: Generated<number>;
  name: string;
  description: string | null;
  price: number;
  quantity: DefaultableNumber;
  created_at: Generated<Date>;
  updated_at: UpdateableTimestamp;
  deleted_at: SoftDeleteTimestamp;
}

// =====================================================
// SESSIONS
// status: 1 = draft, 2 = finalized, 3 = locked
// =====================================================
export interface SessionsTable {
  id: Generated<number>;
  session_date: ColumnType<string, Date | string, Date | string>;
  court_id: number | null;
  duration_hours: ColumnType<string, number | string, number | string>;
  status: DefaultableNumber;
  is_scheduled: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: UpdateableTimestamp;
  deleted_at: SoftDeleteTimestamp;
}

// =====================================================
// SESSION PARTICIPANTS
// type_snapshot: 1 = internal, 2 = guest
// =====================================================
export interface SessionParticipantsTable {
  id: Generated<number>;
  session_id: number;
  user_id: number;
  type_snapshot: number;
  created_at: Generated<Date>;
  updated_at: UpdateableTimestamp;
  deleted_at: SoftDeleteTimestamp;
}

// =====================================================
// SESSION SHUTTLECOCK SNAPSHOTS
// =====================================================
export interface SessionShuttlecockSnapshotsTable {
  id: Generated<number>;
  session_id: number;
  shuttlecock_id: number | null;
  shuttlecock_name_snapshot: string | null;
  unit_price_snapshot: number;
  quantity: number;
  total_amount: number;
  created_at: Generated<Date>;
}

// =====================================================
// SESSION SNAPSHOTS
// cost_strategy: 1 = equal_split, 2 = internal_only_split, 3 = weighted
// =====================================================
export interface SessionSnapshotsTable {
  id: Generated<number>;
  session_id: number;
  total_participants: number;
  total_internal: number;
  total_guest: number;
  court_id_snapshot: number | null;
  court_name_snapshot: string | null;
  court_price_snapshot: number;
  shuttlecock_total_amount: number;
  other_cost: DefaultableNumber;
  total_cost: number;
  subsidy_used: number;
  subsidy_remaining_after: number;
  cost_strategy: number;
  calculation_metadata: unknown | null;
  note: string | null;
  created_at: Generated<Date>;
  updated_at: UpdateableTimestamp;
  deleted_at: SoftDeleteTimestamp;
}

// =====================================================
// SESSION USER SNAPSHOTS
// =====================================================
export interface SessionUserSnapshotsTable {
  id: Generated<number>;
  session_id: number;
  user_id: number;
  type_snapshot: number;
  cost_share: number;
  subsidy_share: number;
  final_amount: number;
  is_paid: DefaultableBoolean;
  paid_at: Date | null;
  created_at: Generated<Date>;
  updated_at: UpdateableTimestamp;
  deleted_at: SoftDeleteTimestamp;
}

// =====================================================
// SUBSIDIES
// =====================================================
export interface SubsidiesTable {
  id: Generated<number>;
  month: ColumnType<string, Date | string, Date | string>;
  total_amount: DefaultableNumber;
  used_amount: DefaultableNumber;
  created_at: Generated<Date>;
  updated_at: UpdateableTimestamp;
  deleted_at: SoftDeleteTimestamp;
}

// =====================================================
// SUBSIDY USAGES
// =====================================================
export interface SubsidyUsagesTable {
  id: Generated<number>;
  subsidy_id: number | null;
  session_id: number | null;
  amount: number;
  created_at: Generated<Date>;
}

export interface DatabaseSchema {
  users: UsersTable;
  courts: CourtsTable;
  shuttlecocks: ShuttlecocksTable;
  sessions: SessionsTable;
  session_participants: SessionParticipantsTable;
  session_shuttlecock_snapshots: SessionShuttlecockSnapshotsTable;
  session_snapshots: SessionSnapshotsTable;
  session_user_snapshots: SessionUserSnapshotsTable;
  subsidies: SubsidiesTable;
  subsidy_usages: SubsidyUsagesTable;
}
