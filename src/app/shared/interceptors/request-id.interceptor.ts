import type { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

/** Correlates a front request with the backend log (same name as ms-template). */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Adds `x-request-id: <uuid>` to requests to `environment.apiUrl`, unless the
 * caller already sent one.
 *
 * Only the app's own API gets the header: third-party APIs get nothing, so it
 * never triggers an extra CORS preflight on an origin that does not allow it.
 */
export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (
    !req.url.startsWith(environment.apiUrl) ||
    req.headers.has(REQUEST_ID_HEADER)
  ) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { [REQUEST_ID_HEADER]: crypto.randomUUID() },
    }),
  );
};
