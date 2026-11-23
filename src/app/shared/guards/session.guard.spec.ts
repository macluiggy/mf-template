import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Router } from '@angular/router';

import { createNotifierMock } from '../../../testing';
import { AUTH_TOKEN_PROVIDER } from '../../core/auth-token';
import { Notifier } from '../../core/notifier';
import {
  SESSION_LOGIN_PATH_DEFAULT,
  SESSION_REQUIRED_MESSAGE,
  sessionGuard,
} from './session.guard';

function run(token: string | null, loginPath?: string) {
  const notifier = createNotifierMock();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AUTH_TOKEN_PROVIDER, useValue: () => token },
      { provide: Notifier, useValue: notifier },
    ],
  });
  const guard = loginPath ? sessionGuard(loginPath) : sessionGuard();
  const result = TestBed.runInInjectionContext(() =>
    guard(
      {} as ActivatedRouteSnapshot,
      {
        url: '/users',
      } as RouterStateSnapshot,
    ),
  );
  return { notifier, result, router: TestBed.inject(Router) };
}

describe('sessionGuard', () => {
  it('lets the route through with a usable token', () => {
    const { notifier, result } = run('abc');

    expect(result).toBe(true);
    expect(notifier.warning).not.toHaveBeenCalled();
  });

  it('warns and redirects to the login page without a token', () => {
    const { notifier, result, router } = run(null);

    expect(notifier.warning).toHaveBeenCalledWith(SESSION_REQUIRED_MESSAGE);
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      `${SESSION_LOGIN_PATH_DEFAULT}?returnUrl=%2Fusers`,
    );
  });

  it('honors a custom login path', () => {
    const { result, router } = run(null, '/auth/sign-in');

    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/auth/sign-in?returnUrl=%2Fusers',
    );
  });
});
