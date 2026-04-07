import { Kysely, PostgresDialect } from 'kysely';
import { Pool, types } from 'pg';
import { ConfigService } from '@nestjs/config';

// Return PostgreSQL `date` columns as plain 'YYYY-MM-DD' strings instead of
// letting pg parse them into Date objects (which shifts the value when the
// server timezone differs from UTC).
types.setTypeParser(1082, (val) => val);

export class Database {
  private static instance: Kysely<any> | null = null;
  private static nodeEnv: string | undefined;

  private constructor() {}

  public static async init(config: ConfigService): Promise<Kysely<any>> {
    if (!Database.instance) {
      Database.nodeEnv = config.get<string>('NODE_ENV');
      try {
        const pool = new Pool({
          host: config.get<string>('DB_HOST') ?? 'localhost',
          port: config.get<number>('DB_PORT') ?? 5432,
          user: config.get<string>('DB_USER') ?? 'postgres',
          password: config.get<string>('DB_PASSWORD') ?? 'postgres',
          database: config.get<string>('DB_NAME') ?? 'focus_tracker',
          max: config.get<number>('DB_POOL_MAX_CONNECTION') ?? 10,
        });
        const dialect = new PostgresDialect({
          pool: pool,
        });
        Database.instance = new Kysely({ dialect, log: this.log });
        const client = await pool.connect();
        client.release();
        console.log(
          '[Database] Connection to Postgres established successfully.',
        );
      } catch (error) {
        console.error('[Database] Failed to connect to Postgres:', error);
        throw error;
      }
    }

    return Database.instance;
  }

  public static getInstance(): Kysely<any> {
    if (!Database.instance) {
      throw new Error('Database instance is not initialized yet.');
    }

    return Database.instance;
  }

  private static sqlUppercase = (sql: string) => {
    return sql.replace(
      /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|ON|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET|AS|AND|OR|NOT|IN|IS|NULL|DISTINCT|UNION|ALL|EXISTS|CASE|WHEN|THEN|ELSE|END)\b/gi,
      (match: any) => match.toUpperCase(),
    );
  };

  private static log = (event: any) => {
    const date = new Date().toISOString();
    const colorReset = '\x1b[0m';
    const colorRed = '\x1b[31m';
    const colorGreen = '\x1b[32m';
    const colorBlue = '\x1b[34m';
    const colorMagenta = '\x1b[35m';

    if (Database.nodeEnv !== 'development') {
      return;
    }

    if (event.level === 'error') {
      console.error(
        `${colorMagenta}${date} [ERROR]: ${colorRed}${event.error}${colorReset}`,
      );
    } else {
      console.log(
        `${colorMagenta}${date} [DEBUG]: ${colorGreen}${this.sqlUppercase(event.query.sql)} / [${event.query.parameters}], ${colorBlue}Duration: ${event.queryDurationMillis}ms${colorReset}`,
      );
    }
  };
}
