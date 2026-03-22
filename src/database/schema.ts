/**
 * Central Kysely database schema.
 * Add a table interface and register it here whenever a new migration creates a table.
 *
 * Example:
 *   import type { Generated } from 'kysely';
 *
 *   export interface UsersTable {
 *     id: Generated<string>;
 *     email: string;
 *     created_at: Generated<Date>;
 *   }
 *
 *   export interface DatabaseSchema {
 *     users: UsersTable;
 *   }
 */
export interface DatabaseSchema {
  // Tables are registered here as migrations are created.
}
