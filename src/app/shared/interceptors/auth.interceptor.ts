import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageEnum } from '../enums/storage.enum';
import { isUsableBearerToken } from '../helpers/bearer-token.helper';
import { StorageService } from '../services/storage.service';

/**
 * Adds `Authorization: Bearer <token>` when a usable access token is stored.
 * An Authorization header set explicitly by the caller is never overwritten.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(StorageService).getLocalStorage(StorageEnum.ACCESS_TOKEN);
  if (!isUsableBearerToken(token) || req.headers.has('Authorization')) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
