import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AUTH_TOKEN_PROVIDER } from '../../core/auth-token';
import { isUsableBearerToken } from '../helpers/bearer-token.helper';

/**
 * Adds `Authorization: Bearer <token>` when the `AUTH_TOKEN_PROVIDER` port
 * returns a usable token. It knows nothing about where that token comes from
 * (the NEOCORE integration reads the host's encrypted storage) and adds no
 * other header. An Authorization header set explicitly by the caller is never
 * overwritten.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AUTH_TOKEN_PROVIDER)();
  if (!isUsableBearerToken(token) || req.headers.has('Authorization')) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
