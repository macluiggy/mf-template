import {
  type HttpHandlerFn,
  type HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  InjectionToken,
  inject,
  type EnvironmentProviders,
} from '@angular/core';

import { authInterceptor } from '../interceptors/auth.interceptor';

/**
 * Functional interceptors contributed by integrations.
 *
 * Multi token: each integration adds its own providers (for example NEOCORE's
 * `deviceInfoInterceptor`). The generic app never imports them, so removing an
 * integration leaves this list empty.
 */
export const APP_HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptorFn[]>(
  'APP_HTTP_INTERCEPTORS',
);

/** Runs the contributed interceptors after the ones of this file. */
const runContributedInterceptors: HttpInterceptorFn = (req, next) => {
  const interceptors = inject(APP_HTTP_INTERCEPTORS, { optional: true }) ?? [];
  const chain = interceptors.reduceRight<HttpHandlerFn>(
    (nextInterceptor, interceptor) => (request) =>
      interceptor(request, nextInterceptor),
    next,
  );

  return chain(req);
};

/**
 * The single HttpClient configuration of this app.
 *
 * Register it in BOTH places:
 *   - `app.config.ts`, for standalone development (`bun run start`);
 *   - the `providers` of the root route of every exposed `Routes` array, so the
 *     interceptors also apply when the host mounts the remote (the host never
 *     runs this app's `app.config.ts`).
 *
 * It always adds the Bearer header from `AUTH_TOKEN_PROVIDER` and every
 * interceptor contributed through `APP_HTTP_INTERCEPTORS`. Use the arguments
 * for interceptors that belong to the app itself.
 */
export function provideAppHttpClient(
  ...extraInterceptors: HttpInterceptorFn[]
): EnvironmentProviders {
  return provideHttpClient(
    withInterceptors([
      authInterceptor,
      ...extraInterceptors,
      runContributedInterceptors,
    ]),
  );
}

/**
 * @deprecated Use {@link provideAppHttpClient}. Kept as an alias so forks keep
 * compiling after a template sync.
 */
export const provideMfHttpClient = provideAppHttpClient;
