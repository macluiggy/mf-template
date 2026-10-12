import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { StorageEnum } from '../enums/storage.enum';
import { isUsableBearerToken } from '../helpers/bearer-token.helper';
import { StorageService } from '../services/storage.service';

/**
 * Adds `x-device-info` to every request and `Authorization: Bearer <token>`
 * when the host stored a usable access token. Same contract as frontcore.
 * An Authorization header set explicitly by the caller is never overwritten.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const device = inject(DeviceDetectorService);

  const deviceInfo = Object.entries(device.deviceInfo())
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  const token = storage.getLocalStorage(StorageEnum.ACCESS_TOKEN);
  const addBearer = isUsableBearerToken(token) && !req.headers.has('Authorization');

  return next(
    req.clone({
      setHeaders: {
        'x-device-info': deviceInfo,
        ...(addBearer ? { Authorization: `Bearer ${token}` } : {}),
      },
    }),
  );
};
