/** Record returned by the backend for this module. */
export interface TemplateInterface {
  id: number;
  name: string;
  status: boolean;
}

/** Query parameters of the list endpoint. */
export interface TemplateParamsInterface {
  page: number;
  limit: number;
  search?: string | null;
}
