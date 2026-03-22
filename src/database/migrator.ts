import * as path from 'path';
import * as fs from 'fs/promises';
import {
  Kysely,
  Migration,
  MigrationProvider,
  MigrationResultSet,
  Migrator,
} from 'kysely';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Database } from './database';

@Module({ imports: [ConfigModule.forRoot()] })
class CliConfigModule {}

const MIGRATION_SUFFIX = '.migration.ts';
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Loads *.migration.ts files from the migrations directory.
 * Migration name is the filename without the .migration.ts suffix,
 * e.g. "user-1710000000000" from "user-1710000000000.migration.ts".
 * Kysely sorts migrations by name, so the timestamp prefix ensures
 * correct execution order.
 */
class TypeScriptMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {};

    let files: string[];
    try {
      files = await fs.readdir(MIGRATIONS_DIR);
    } catch {
      return migrations;
    }

    for (const fileName of files.sort()) {
      if (!fileName.endsWith(MIGRATION_SUFFIX)) continue;

      const name = fileName.slice(0, -MIGRATION_SUFFIX.length);
      const filePath = path.join(MIGRATIONS_DIR, fileName);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(filePath);

      if (typeof mod.up !== 'function') {
        throw new Error(
          `Migration "${fileName}" must export an "up" function.`,
        );
      }

      migrations[name] = {
        up: mod.up,
        down: typeof mod.down === 'function' ? mod.down : undefined,
      };
    }

    return migrations;
  }
}

function printResults({ error, results }: MigrationResultSet): void {
  if (error && !results?.length) {
    console.error('\nFailed:', error);
    process.exit(1);
  }

  if (!results?.length) {
    console.log('  No migrations to run.');
    return;
  }

  for (const result of results) {
    const icon = result.status === 'Success' ? '✓' : '✗';
    const arrow = result.direction === 'Up' ? '↑' : '↓';
    console.log(`  ${icon} ${arrow} ${result.migrationName}`);
  }

  if (error) {
    console.error('\nFailed:', error);
    process.exit(1);
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

  const migrator = new Migrator({
    db,
    provider: new TypeScriptMigrationProvider(),
    migrationTableName: 'kysely_migrations',
    migrationLockTableName: 'kysely_migration_lock',
  });

  try {
    switch (command) {
      case 'latest': {
        console.log('Running all pending migrations...');
        printResults(await migrator.migrateToLatest());
        break;
      }
      case 'up': {
        console.log('Running next migration...');
        printResults(await migrator.migrateUp());
        break;
      }
      case 'down': {
        console.log('Rolling back last migration...');
        printResults(await migrator.migrateDown());
        break;
      }
      case 'list': {
        const pending = await migrator.getMigrations();
        console.log('\nMigrations:');
        for (const m of pending) {
          const status = m.executedAt
            ? `executed at ${m.executedAt.toISOString()}`
            : 'pending';
          console.log(`  ${m.name}  —  ${status}`);
        }
        break;
      }
      default: {
        console.log('Usage: pnpm migrate:<latest|up|down|list>');
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
