import {
  type HttpInterceptorFn,
  HttpContextToken,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { Notifier } from '../../core/notifier';
import { SESSION_EXPIRED_HANDLER } from '../../core/session-expired';
import { toUserMessage } from '../helpers/error-message.helper';

/**
 * Requests that show their own message set it to `true`, so the user reads one
 * message and not two.
 *
 * @example
 * http.get(url, {
 *   context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
 * });
 */
export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(
  () => false,
);

/**
 * Shows one `Notifier.error` message for every failed HTTP request, using the
 * backend's envelope message (`toUserMessage`) and rethrowing the same error so
 * the caller still handles it (its own state, its own retry).
 *
 * A 401 also calls the `SESSION_EXPIRED_HANDLER` port. The message is shown
 * unless the request opted out with {@link SKIP_ERROR_NOTIFICATION}.
 *
 * It only runs in standalone development: a hosted remote uses the host's
 * HttpClient and interceptors.
 */
export const errorNotificationInterceptor: HttpInterceptorFn = (req, next) => {
  const notifier = inject(Notifier);
  const onSessionExpired = inject(SESSION_EXPIRED_HANDLER);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          onSessionExpired();
        }
        if (!req.context.get(SKIP_ERROR_NOTIFICATION)) {
          notifier.error(toUserMessage(error));
        }
      }
      return throwError(() => error);
    }),
  );
};
