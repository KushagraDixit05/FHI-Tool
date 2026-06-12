/** Barrel for shared backend utilities. Import from '../../shared'. */
export {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
} from './errors/AppError';
export { asyncHandler } from './http/asyncHandler';
export {
  getPagination,
  paginatedResult,
  type PageParams,
  type PaginatedResult,
} from './http/pagination';
