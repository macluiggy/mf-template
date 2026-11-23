import type { Provider } from '@angular/core';
import { InjectionToken } from '@angular/core';

/** Called once when the backend answers a request with 401. */
export type SessionExpiredHandler = () => void;

/** Default: nothing to do (there is no session outside a host). */
const NOOP_SESSION_EXPIRED_HANDLER: SessionExpiredHandler = () => {
  // Nothing to clean up: the generic app keeps no session of its own.
};

/**
 * Port invoked when a request comes back with 401, the usual "session is no
 * longer valid" answer.
 *
 * The default does nothing, so the generic app only shows the error message.
 * An integration decides what "expired" means for its host: for example
 * clearing the token and redirecting to the login page.
 */
export const SESSION_EXPIRED_HANDLER =
  new InjectionToken<SessionExpiredHandler>('SESSION_EXPIRED_HANDLER', {
    factory: () => NOOP_SESSION_EXPIRED_HANDLER,
  });

/** Binds the 401 reaction of the app to the {@link SESSION_EXPIRED_HANDLER} port. */
export function provideSessionExpiredHandler(
  handler: SessionExpiredHandler,
): Provider {
  return { provide: SESSION_EXPIRED_HANDLER, useValue: handler };
}
