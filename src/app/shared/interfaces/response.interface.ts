/** Response envelope expected from the backend (`{ data, message }`). Adapt it to your API. */
export interface ServiceResponseInterface<T> {
  data: T;
  message: string;
}

/** Paginated payload returned inside `data`. */
export interface PaginationResponseInterface<T> {
  records: T;
  total: number;
  page: number;
  totalPage: number;
}
