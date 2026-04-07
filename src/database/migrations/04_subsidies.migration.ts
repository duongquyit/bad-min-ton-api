import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('subsidies')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('month', 'date', (col) => col.notNull().unique())
    .addColumn('total_amount', 'integer', (col) =>
      col.notNull().defaultTo(2000000),
    )
    .addColumn('used_amount', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('idx_subsidies_month')
    .on('subsidies')
    .column('month')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_subsidies_month').execute();
  await db.schema.dropTable('subsidies').execute();
}
