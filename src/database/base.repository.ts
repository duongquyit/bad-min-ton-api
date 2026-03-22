import { Kysely, Selectable, Insertable, Updateable, sql } from 'kysely';
import { Database } from './database';
import { ResourceNotFoundException } from '../common/exceptions/app.exception';

// Opaque alias — callers work with TransactionClient without importing Kysely directly.
export type TransactionClient = Kysely<any>;

export interface OrderBy<Model> {
  column: keyof Selectable<Model> & string;
  direction?: 'asc' | 'desc';
}

export interface FindOptions<Model> {
  where?: Partial<Selectable<Model>>;
  orderBy?: OrderBy<Model>;
  limit?: number;
  offset?: number;
}

export type FindManyOptions<Model> = Omit<FindOptions<Model>, 'where'>;

export interface WriteOptions {
  /**
   * When `true` and no `trx` is provided, the operation is wrapped in its own
   * transaction that is committed on success and rolled back on error.
   */
  isTransaction?: boolean;
  /**
   * An existing transaction client obtained from `withTransaction()`.
   * When provided, the operation joins that transaction instead of creating one.
   * Takes precedence over `isTransaction`.
   */
  trx?: TransactionClient;
}

/**
 * Abstract base repository typed to a single table model interface.
 *
 * Type parameter:
 *   Model — the Kysely table interface for this repository's table.
 *           Use `Generated<T>` / `ColumnType<S,I,U>` for columns whose
 *           select / insert / update types differ.
 *
 * Usage:
 *   // 1. Define the table interface (co-located with its migration)
 *   export interface UsersTable {
 *     id:         Generated<string>;
 *     email:      string;
 *     name:       string;
 *     created_at: Generated<Date>;
 *   }
 *
 *   // 2. Extend BaseRepository with the table interface
 *   @Injectable()
 *   export class UsersRepository extends BaseRepository<UsersTable> {
 *     protected readonly tableName = 'users';
 *   }
 *
 *   // 3. Single-op transaction
 *   await repo.create(data, { isTransaction: true });
 *
 *   // 4. Multi-op transaction block
 *   await repo.withTransaction(async (trx) => {
 *     await userRepo.create(userData, { trx });
 *     await sessionRepo.create(sessionData, { trx });
 *   });
 *
 * Assumptions:
 *   - All tables have an `id` UUID primary key column.
 *   - PostgreSQL dialect (RETURNING clause on insert / update).
 */
export class BaseRepository<Model> {
  protected readonly tableName: string;
  protected get db(): Kysely<any> {
    return Database.getInstance();
  }

  /**
   * Controls the delete strategy for this repository.
   * - `true`  (default) — soft delete: sets `deleted_at` and excludes deleted rows from all queries.
   * - `false`           — hard delete: issues a physical `DELETE` and applies no `deleted_at` filters.
   *
   * Override in the subclass to opt out:
   * @example
   * protected readonly softDelete = false;
   */
  protected readonly softDelete: boolean = true;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Resolves the database client to use for a write operation:
   *   - `trx` provided   → use the external transaction client
   *   - `isTransaction`  → create and manage an internal transaction
   *   - otherwise        → plain execution on the default db
   */
  private resolveDb(
    fn: (db: Kysely<any>) => Promise<any>,
    options?: WriteOptions,
  ): Promise<any> {
    if (options?.trx) {
      return fn(options.trx);
    }
    if (options?.isTransaction) {
      return this.db.transaction().execute(fn);
    }
    return fn(this.db);
  }

  /**
   * Applies equality `where`, `orderBy`, `limit`, and `offset` to any
   * Kysely select query builder. Each clause is applied only when defined.
   */
  private applyOptions(query: any, options?: FindOptions<Model>): any {
    if (options?.where) {
      for (const [col, val] of Object.entries(options.where)) {
        if (Array.isArray(val)) {
          query = query.where(col, 'in', val);
        } else if (val !== undefined) {
          query = query.where(col, '=', val);
        }
      }
    }

    if (options?.orderBy) {
      query = query.orderBy(
        options.orderBy.column,
        options.orderBy.direction ?? 'asc',
      );
    }

    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    if (options?.offset !== undefined) {
      query = query.offset(options.offset);
    }

    return query;
  }

  // ─── Transaction ───────────────────────────────────────────────────────────

  /**
   * Runs multiple operations inside a single database transaction.
   * The `TransactionClient` is passed to each write method via `{ trx }`.
   *
   * @example
   * await userRepo.withTransaction(async (trx) => {
   *   const user = await userRepo.create(userData, { trx });
   *   await profileRepo.create({ userId: user.id, ...profileData }, { trx });
   * });
   */
  withTransaction<T>(fn: (trx: TransactionClient) => Promise<T>): Promise<T> {
    return this.db.transaction().execute(fn);
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /**
   * @example
   * repo.findAll()
   * repo.findAll({ where: { status: 'active' } })
   * repo.findAll({ orderBy: { column: 'created_at', direction: 'desc' }, limit: 20, offset: 0 })
   */
  async findAll(options?: FindOptions<Model>): Promise<Selectable<Model>[]> {
    let base = this.db.selectFrom(this.tableName).selectAll();
    if (this.softDelete) {
      base = base.where('deleted_at', 'is', null);
    }
    const query = this.applyOptions(base, options);
    const rows = await query.execute();
    return rows as unknown as Selectable<Model>[];
  }

  /**
   * Find all rows where `column = value`, with optional ordering and pagination.
   *
   * @example
   * repo.findBy('role', 'admin', { orderBy: { column: 'created_at' }, limit: 10 })
   */
  async findBy<K extends keyof Selectable<Model> & string>(
    column: K,
    value: Selectable<Model>[K],
    options?: FindManyOptions<Model>,
  ): Promise<Selectable<Model>[]> {
    let base = this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where(column, '=', value as any);
    if (this.softDelete) {
      base = base.where('deleted_at', 'is', null);
    }
    const query = this.applyOptions(base, options);
    const rows = await query.execute();
    return rows as unknown as Selectable<Model>[];
  }

  /**
   * Find the first row where `column = value`, or `undefined` if none.
   *
   * @example
   * repo.findOneBy('email', 'user@example.com')
   */
  async findOneBy<K extends keyof Selectable<Model> & string>(
    column: K,
    value: Selectable<Model>[K],
  ): Promise<Selectable<Model> | undefined> {
    let query = this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where(column, '=', value as any);
    if (this.softDelete) {
      query = query.where('deleted_at', 'is', null);
    }
    const row = await query.executeTakeFirst();
    return row as unknown as Selectable<Model> | undefined;
  }

  async findById(id: string): Promise<Selectable<Model> | undefined> {
    let query = this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('id', '=', id);
    if (this.softDelete) {
      query = query.where('deleted_at', 'is', null);
    }
    const row = await query.executeTakeFirst();
    return row as unknown as Selectable<Model> | undefined;
  }

  /** Count all non-deleted rows, with optional equality filters. */
  async count(where?: Partial<Selectable<Model>>): Promise<number> {
    let query = this.db
      .selectFrom(this.tableName)
      .select(sql<string>`COUNT(*)`.as('count'));
    if (this.softDelete) {
      query = query.where('deleted_at', 'is', null);
    }
    if (where) {
      for (const [col, val] of Object.entries(where)) {
        if (val !== undefined) {
          query = query.where(col, '=', val);
        }
      }
    }
    const row = await query.executeTakeFirstOrThrow();
    return Number(row.count);
  }

  /** Like `findById` but throws `ResourceNotFoundException` when the row is missing. */
  async findByIdOrThrow(id: string): Promise<Selectable<Model>> {
    const row = await this.findById(id);
    if (!row) throw new ResourceNotFoundException();
    return row;
  }

  // ─── Write ─────────────────────────────────────────────────────────────────

  async create(
    data: Insertable<Model>,
    options?: WriteOptions,
  ): Promise<Selectable<Model>> {
    const row = await this.resolveDb(
      (db) =>
        db
          .insertInto(this.tableName)
          .values(data as any)
          .returningAll()
          .executeTakeFirstOrThrow(),
      options,
    );
    return row as Selectable<Model>;
  }

  async update(
    id: string,
    data: Updateable<Model>,
    options?: WriteOptions,
  ): Promise<Selectable<Model> | undefined> {
    const row = await this.resolveDb((db) => {
      let query = db
        .updateTable(this.tableName)
        .set(data as any)
        .where('id', '=', id);
      if (this.softDelete) {
        query = query.where('deleted_at', 'is', null);
      }
      return query.returningAll().executeTakeFirst();
    }, options);
    return row as Selectable<Model> | undefined;
  }

  async delete(id: string, options?: WriteOptions): Promise<void> {
    if (this.softDelete) {
      await this.resolveDb(
        (db) =>
          db
            .updateTable(this.tableName)
            .set({ deleted_at: new Date() } as any)
            .where('id', '=', id)
            .where('deleted_at', 'is', null)
            .execute(),
        options,
      );
    } else {
      await this.resolveDb(
        (db) => db.deleteFrom(this.tableName).where('id', '=', id).execute(),
        options,
      );
    }
  }
}
