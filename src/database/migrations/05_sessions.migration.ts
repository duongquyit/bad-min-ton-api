import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('sessions')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('session_date', 'date', (col) => col.notNull())
    .addColumn('court_id', 'integer', (col) => col.references('courts.id'))
    .addColumn('status', 'int2', (col) => col.notNull().defaultTo(1))
    .addColumn('duration_hours', 'numeric(4, 2)', (col) => col.notNull())
    .addColumn('is_scheduled', 'boolean', (col) => col.defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('idx_sessions_date')
    .on('sessions')
    .column('session_date')
    .execute();

  await db.schema
    .createIndex('idx_sessions_status')
    .on('sessions')
    .column('status')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_sessions_status').execute();
  await db.schema.dropIndex('idx_sessions_date').execute();
  await db.schema.dropTable('sessions').execute();
}
