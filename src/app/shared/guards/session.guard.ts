import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { AUTH_TOKEN_PROVIDER } from '../../core/auth-token';
import { Notifier } from '../../core/notifier';
import { isUsableBearerToken } from '../helpers/bearer-token.helper';

/** Where `sessionGuard` sends a user without a session. */
export const SESSION_LOGIN_PATH_DEFAULT = '/login';

/** Shown when a route needs a session and there is none. */
export const SESSION_REQUIRED_MESSAGE = 'Inicie sesión para continuar.';

/**
 * Blocks a route unless `AUTH_TOKEN_PROVIDER` returns a usable bearer token.
 * On block it warns the user and redirects to `loginPath`, keeping the
 * attempted URL as `returnUrl` so the login page can come back to it.
 *
 * @example
 * { path: 'users', canActivate: [sessionGuard()], loadChildren: ... }
 */
export function sessionGuard(
  loginPath: string = SESSION_LOGIN_PATH_DEFAULT,
): CanActivateFn {
  return (_route, state) => {
    if (isUsableBearerToken(inject(AUTH_TOKEN_PROVIDER)())) {
      return true;
    }
    inject(Notifier).warning(SESSION_REQUIRED_MESSAGE);
    return inject(Router).createUrlTree([loginPath], {
      queryParams: { returnUrl: state.url },
    });
  };
}
