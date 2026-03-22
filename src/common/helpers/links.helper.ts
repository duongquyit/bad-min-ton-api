import type { PaginationMeta } from './pagination.helper';

export interface LinksMeta {
  self: string;
  first: string;
  last: string;
  next: string | null;
  prev: string | null;
}

export class LinksHelper {
  /**
   * Build HATEOAS-style pagination links.
   *
   * @param baseUrl  The base URL of the collection endpoint (no query string).
   * @param pagination  Pagination metadata produced by `PaginationHelper.build`.
   * @param extraQuery  Additional query params to preserve (e.g. filters, search).
   */
  static build(
    baseUrl: string,
    pagination: PaginationMeta,
    extraQuery: Record<string, unknown> = {},
  ): LinksMeta {
    const { page, limit, total_pages: totalPages } = pagination;

    const url = (p: number) => {
      const params = new URLSearchParams(
        Object.entries({ ...extraQuery, page: String(p), limit: String(limit) }).map(
          ([k, v]) => [k, String(v)],
        ),
      );
      return `${baseUrl}?${params.toString()}`;
    };

    return {
      self: url(page),
      first: url(1),
      last: url(Math.max(totalPages, 1)),
      next: page < totalPages ? url(page + 1) : null,
      prev: page > 1 ? url(page - 1) : null,
    };
  }
}
