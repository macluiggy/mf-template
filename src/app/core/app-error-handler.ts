import { HttpErrorResponse } from '@angular/common/http';
import {
  ErrorHandler,
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

import { toUserMessage } from '../shared/helpers/error-message.helper';
import { Notifier } from './notifier';

/**
 * The app's single error handler: it keeps Angular's log (console) and shows
 * the user one `Notifier.error` message for anything the app did not handle.
 *
 * `HttpErrorResponse` is left to the HTTP error interceptor, so a failed
 * request is notified once, never twice.
 *
 * Registered in `app.config.ts` only: a hosted remote runs the host's handler.
 */
export class AppErrorHandler extends ErrorHandler {
  private readonly notifier = inject(Notifier);

  override handleError(error: unknown): void {
    super.handleError(error);
    if (error instanceof HttpErrorResponse) {
      return;
    }
    this.notifier.error(toUserMessage(error));
  }
}

/** Binds {@link AppErrorHandler} to Angular's error handling. */
export function provideAppErrorHandler(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ErrorHandler, useClass: AppErrorHandler },
  ]);
}
