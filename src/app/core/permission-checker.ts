import type { Provider } from '@angular/core';
import { Injectable } from '@angular/core';

/**
 * Answers "can the signed-in user do `action` on `resource`?".
 *
 * The app only uses it to show or hide UI and to guard routes; the backend
 * still enforces the real permission. The default adapter allows everything,
 * so a standalone app needs no auth. `provideNeocoreHost()` binds the host's
 * permission payloads instead.
 */
export abstract class PermissionChecker {
  abstract can(resource: string, action: string): boolean;
}

/** Default adapter: every action is allowed. */
@Injectable()
export class AllowAllPermissionChecker extends PermissionChecker {
  can(_resource: string, _action: string): boolean {
    return true;
  }
}

/** Binds the allow-all adapter to the {@link PermissionChecker} port. */
export function provideAllowAllPermissionChecker(): Provider {
  return { provide: PermissionChecker, useClass: AllowAllPermissionChecker };
}
