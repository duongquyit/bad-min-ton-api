import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('session_user_snapshots')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('session_id', 'integer', (col) =>
      col.notNull().references('sessions.id'),
    )
    .addColumn('user_id', 'integer', (col) =>
      col.notNull().references('users.id'),
    )
    .addColumn('type_snapshot', 'int2', (col) => col.notNull())
    .addColumn('cost_share', 'integer', (col) => col.notNull())
    .addColumn('subsidy_share', 'integer', (col) => col.notNull())
    .addColumn('final_amount', 'integer', (col) => col.notNull())
    .addColumn('is_paid', 'boolean', (col) => col.defaultTo(false))
    .addColumn('paid_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz')
    .addUniqueConstraint('session_user_snapshots_session_user_unique', [
      'session_id',
      'user_id',
    ])
    .execute();

  await db.schema
    .createIndex('idx_session_user_snapshots_session')
    .on('session_user_snapshots')
    .column('session_id')
    .execute();

  await db.schema
    .createIndex('idx_session_user_snapshots_user')
    .on('session_user_snapshots')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_session_user_snapshots_user').execute();
  await db.schema.dropIndex('idx_session_user_snapshots_session').execute();
  await db.schema.dropTable('session_user_snapshots').execute();
}
