import type { Provider } from '@angular/core';
import { InjectionToken } from '@angular/core';

/** Returns the current access token, or `null` when there is none. */
export type AuthTokenProvider = () => string | null;

/** The token every request carries as `Authorization: Bearer <token>`. */
export const NULL_AUTH_TOKEN: AuthTokenProvider = () => null;

/**
 * Port for the access token.
 *
 * The default provider returns `null`, so the generic app sends no
 * Authorization header. `provideNeocoreHost()` binds the host's encrypted
 * session token instead.
 */
export const AUTH_TOKEN_PROVIDER = new InjectionToken<AuthTokenProvider>(
  'AUTH_TOKEN_PROVIDER',
  { factory: () => NULL_AUTH_TOKEN },
);

/** Binds the "no token" default to the {@link AUTH_TOKEN_PROVIDER} port. */
export function provideNullAuthToken(): Provider {
  return { provide: AUTH_TOKEN_PROVIDER, useValue: NULL_AUTH_TOKEN };
}
