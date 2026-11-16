import {
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';

import { AUTH_TOKEN_PROVIDER } from '../../core/auth-token';
import { KeyValueStorage } from '../../core/key-value-storage';
import { Notifier } from '../../core/notifier';
import { PermissionChecker } from '../../core/permission-checker';
import { APP_HTTP_INTERCEPTORS } from '../../shared/providers/http.providers';
import { neocoreAuthTokenProvider } from './auth/neocore-auth-token.provider';
import { deviceInfoInterceptor } from './http/device-info.interceptor';
import { NeocorePermissionChecker } from './permission/neocore-permission-checker';
import { PubSubNotifier } from './pubsub/pubsub-notifier';
import { PubSubService } from './pubsub/pubsub.service';
import { EncryptedKeyValueStorage } from './storage/encrypted-key-value-storage';
import { StorageService } from './storage/storage.service';

/**
 * Binds every NEOCORE host adapter over the safe defaults of
 * `provideAppCore()`:
 *
 * - `Notifier`        -> PubSub topics (host loader and toasts)
 * - `KeyValueStorage` -> encrypt-storage with the host's SECRET_KEY
 * - `AUTH_TOKEN_PROVIDER` -> the host's `ACCESS_TOKEN`
 * - `PermissionChecker` -> the host's ROLE_PERMISSION/PERMISSION payloads
 * - `APP_HTTP_INTERCEPTORS` -> `x-device-info`
 *
 * This is the ONLY wiring between the app and the NEOCORE host: delete this
 * folder and every `provideNeocoreHost()` call and the app keeps running on the
 * core defaults (see README.md in this folder).
 */
export function provideNeocoreHost(): EnvironmentProviders {
  return makeEnvironmentProviders([
    StorageService,
    PubSubService,
    { provide: Notifier, useClass: PubSubNotifier },
    { provide: KeyValueStorage, useClass: EncryptedKeyValueStorage },
    { provide: PermissionChecker, useClass: NeocorePermissionChecker },
    {
      deps: [KeyValueStorage],
      provide: AUTH_TOKEN_PROVIDER,
      useFactory: neocoreAuthTokenProvider,
    },
    {
      multi: true,
      provide: APP_HTTP_INTERCEPTORS,
      useValue: deviceInfoInterceptor,
    },
  ]);
}
