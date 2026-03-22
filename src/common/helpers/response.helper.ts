import type { PaginationMeta } from './pagination.helper';

// ─── Response brand types ────────────────────────────────────────────────────

export interface OkResponse<T> {
  readonly _type: 'ok';
  readonly data: T;
}

export interface CreatedResponse<T> {
  readonly _type: 'created';
  readonly data: T;
}

export interface NoContentResponse {
  readonly _type: 'noContent';
}

export interface ListResponse<T> {
  readonly _type: 'list';
  readonly items: T[];
  readonly pagination: PaginationMeta;
}

export type ApiResponse<T = unknown> =
  | OkResponse<T>
  | CreatedResponse<T>
  | NoContentResponse
  | ListResponse<T>;

// ─── Helper ──────────────────────────────────────────────────────────────────

export class ResponseHelper {
  /** 200 OK — single item. */
  static ok<T>(data: T): OkResponse<T> {
    return { _type: 'ok', data };
  }

  /** 201 Created — single item. */
  static created<T>(data: T): CreatedResponse<T> {
    return { _type: 'created', data };
  }

  /** 204 No Content — empty body. */
  static noContent(): NoContentResponse {
    return { _type: 'noContent' };
  }

  /** 200 OK — paginated list. Links are built automatically from the request URL by the interceptor. */
  static list<T>(items: T[], pagination: PaginationMeta): ListResponse<T> {
    return { _type: 'list', items, pagination };
  }
}
