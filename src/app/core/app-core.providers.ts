import {
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';

import { provideNullAuthToken } from './auth-token';
import { provideLocalStorageKeyValueStorage } from './key-value-storage';
import { provideConsoleNotifier } from './notifier';
import { provideAllowAllPermissionChecker } from './permission-checker';

/**
 * Binds every port of the app core to its safe local default:
 * console notifier, plain localStorage, no token and allow-all permissions.
 *
 * Call it in `app.config.ts` (standalone dev) and in the `providers` of every
 * exposed route (the host never runs `app.config.ts`). An integration (for
 * example `provideNeocoreHost()`) overrides the ports it needs, keeping the
 * generic code untouched.
 */
export function provideAppCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideConsoleNotifier(),
    provideLocalStorageKeyValueStorage(),
    provideNullAuthToken(),
    provideAllowAllPermissionChecker(),
  ]);
}
