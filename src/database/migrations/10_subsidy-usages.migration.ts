import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('subsidy_usages')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('subsidy_id', 'integer', (col) => col.references('subsidies.id'))
    .addColumn('session_id', 'integer', (col) => col.references('sessions.id'))
    .addColumn('amount', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('subsidy_usages').execute();
}
