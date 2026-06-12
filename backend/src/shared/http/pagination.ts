/**
 * Pagination helpers — centralise the `skip = (page - 1) * limit` and
 * `totalPages = Math.ceil(total / limit)` math that was duplicated across every
 * list service.
 */

export interface PageParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Normalises arbitrary page/limit input into safe bounds + a Prisma `skip`. */
export function getPagination(input: {
  page?: number | string;
  limit?: number | string;
}): PageParams & { skip: number } {
  const page = Math.max(1, Number(input.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(input.limit) || DEFAULT_LIMIT));
  return { page, limit, skip: (page - 1) * limit };
}

/** Wraps a page of rows + total count into the standard list response shape. */
export function paginatedResult<T>(
  data: T[],
  total: number,
  { page, limit }: PageParams
): PaginatedResult<T> {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
