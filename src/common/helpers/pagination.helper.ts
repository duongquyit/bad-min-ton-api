export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export class PaginationHelper {
  static build({ page, limit, total }: PaginationParams): PaginationMeta {
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    return {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    };
  }

  /** Convert page/limit to the offset value used by SQL queries. */
  static toOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
