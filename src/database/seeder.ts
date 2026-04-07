import * as path from 'path';
import * as fs from 'fs/promises';
import { readFileSync } from 'fs';
import { Kysely, sql } from 'kysely';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Database } from './database';

@Module({ imports: [ConfigModule.forRoot()] })
class CliConfigModule {}

const SEED_SUFFIX = '.seed.json';
const SEEDS_DIR = path.join(__dirname, 'seeds');

/**
 * Extracts the table name from a seed filename.
 * e.g. "01-permissions.seed.json" → "permissions"
 *      "02-role_permissions.seed.json" → "role_permissions"
 */
function getTableName(fileName: string): string {
  return fileName.slice(0, -SEED_SUFFIX.length).replace(/^\d+-/, '');
}

async function getSeedFiles(): Promise<string[]> {
  let files: string[];
  try {
    files = await fs.readdir(SEEDS_DIR);
  } catch {
    return [];
  }
  return files.filter((f) => f.endsWith(SEED_SUFFIX)).sort();
}

async function syncTableIdSequence(
  db: Kysely<any>,
  table: string,
): Promise<void> {
  const sequenceResult = await sql<{ sequence_name: string | null }>`
    SELECT pg_get_serial_sequence(${table}, 'id') AS sequence_name
  `.execute(db);

  const sequenceName = sequenceResult.rows[0]?.sequence_name;
  if (!sequenceName) return;

  await sql`
    SELECT setval(
      ${sequenceName},
      COALESCE((SELECT MAX(id) FROM ${sql.table(table)}), 1),
      EXISTS(SELECT 1 FROM ${sql.table(table)})
    )
  `.execute(db);
}

async function runSeeds(db: Kysely<any>): Promise<void> {
  const files = await getSeedFiles();

  if (!files.length) {
    console.log('  No seed files found.');
    return;
  }

  for (const fileName of files) {
    const table = getTableName(fileName);
    const name = fileName.slice(0, -SEED_SUFFIX.length);

    try {
      const rows: any[] = JSON.parse(
        readFileSync(path.join(SEEDS_DIR, fileName), 'utf-8'),
      );

      if (rows.length) {
        await (db.insertInto(table as any) as any)
          .values(rows)
          .onConflict((oc: any) => oc.doNothing())
          .execute();

        await syncTableIdSequence(db, table);
      }

      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.log(`  ✗ ${name}`);
      console.error(`    Error:`, err);
      throw err;
    }
  }
}

async function clearTables(db: Kysely<any>): Promise<void> {
  const files = await getSeedFiles();
  // Reverse order to respect FK constraints
  const tables = files.map(getTableName).reverse();

  console.log('Clearing seed tables...');
  for (const table of tables) {
    try {
      await sql`TRUNCATE TABLE ${sql.table(table)} RESTART IDENTITY CASCADE`.execute(
        db,
      );
      console.log(`  ✓ cleared ${table}`);
    } catch (err) {
      console.log(`  ✗ failed to clear ${table}`);
      console.error(`    Error:`, err);
      throw err;
    }
  }
}

async function run(): Promise<void> {
  const [, , command] = process.argv;

  const ctx = await NestFactory.createApplicationContext(CliConfigModule, {
    logger: false,
  });
  const config = ctx.get(ConfigService);
  await ctx.close();

  const db = await Database.init(config);

  try {
    switch (command) {
      case 'run': {
        console.log('Running all seeds...');
        await runSeeds(db);
        console.log('\nDone.');
        break;
      }
      case 'fresh': {
        await clearTables(db);
        console.log('\nRunning all seeds...');
        await runSeeds(db);
        console.log('\nDone.');
        break;
      }
      default: {
        console.log('Usage: pnpm seed | pnpm seed:fresh');
        process.exit(1);
      }
    }
  } finally {
    await db.destroy();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
