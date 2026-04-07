import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('session_snapshots')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('session_id', 'integer', (col) =>
      col.notNull().unique().references('sessions.id'),
    )
    .addColumn('total_participants', 'integer', (col) => col.notNull())
    .addColumn('total_internal', 'integer', (col) => col.notNull())
    .addColumn('total_guest', 'integer', (col) => col.notNull())
    .addColumn('court_id_snapshot', 'integer')
    .addColumn('court_name_snapshot', 'varchar(255)')
    .addColumn('court_price_snapshot', 'integer', (col) => col.notNull())
    .addColumn('shuttlecock_total_amount', 'integer', (col) => col.notNull())
    .addColumn('other_cost', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('total_cost', 'integer', (col) => col.notNull())
    .addColumn('subsidy_used', 'integer', (col) => col.notNull())
    .addColumn('subsidy_remaining_after', 'integer', (col) => col.notNull())
    .addColumn('cost_strategy', 'int2', (col) => col.notNull())
    .addColumn('calculation_metadata', 'jsonb')
    .addColumn('note', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('session_snapshots').execute();
}
