import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';

/**
 * NEOCORE adapter: adds the `x-device-info` header the gateway expects.
 *
 * Contributed by `provideNeocoreHost()` through the `APP_HTTP_INTERCEPTORS`
 * token, so the generic HttpClient configuration never knows about it.
 */
export const deviceInfoInterceptor: HttpInterceptorFn = (req, next) => {
  const device = inject(DeviceDetectorService);
  const deviceInfo = Object.entries(device.deviceInfo())
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return next(req.clone({ setHeaders: { 'x-device-info': deviceInfo } }));
};
