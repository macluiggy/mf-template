/** Standard envelope returned by Neocore backends (`{ data, message }`). */
export interface ServiceResponseInterface<T> {
  data: T;
  message: string;
}

/** Standard paginated payload returned inside `data`. */
export interface PaginationResponseInterface<T> {
  records: T;
  total: number;
  page: number;
  totalPage: number;
}
