import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('session_shuttlecock_snapshots')
    .addColumn('id', 'bigserial', (col) => col.primaryKey())
    .addColumn('session_id', 'bigint', (col) =>
      col.notNull().references('sessions.id'),
    )
    .addColumn('shuttlecock_id', 'bigint')
    .addColumn('shuttlecock_name_snapshot', 'varchar(255)')
    .addColumn('unit_price_snapshot', 'integer', (col) => col.notNull())
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('total_amount', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('session_shuttlecock_snapshots').execute();
}
