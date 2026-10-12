import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { EnvironmentProviders } from '@angular/core';
import { authInterceptor } from '../interceptors/auth.interceptor';

/**
 * The single HttpClient configuration of this MF.
 *
 * Register it in BOTH places:
 *   - `app.config.ts`, for standalone development (`bun run start`);
 *   - the `providers` of the root route of every exposed `Routes` array, so the
 *     interceptors also apply when the host mounts the remote (the host never
 *     runs this app's `app.config.ts`).
 *
 * Add new functional interceptors to the list below, never to a single place.
 */
export function provideMfHttpClient(): EnvironmentProviders {
  return provideHttpClient(withInterceptors([authInterceptor]));
}
