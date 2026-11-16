import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';

import { Notifier } from '../../core/notifier';
import { PermissionChecker } from '../../core/permission-checker';

/** Shown when a route is blocked. */
export const PERMISSION_DENIED_MESSAGE =
  'No tiene permisos para acceder a esta opción.';

/**
 * Blocks a route unless the user can do `action` on `resource`, using only the
 * `PermissionChecker` and `Notifier` ports. On deny it keeps the user where
 * they are and asks the notifier for a warning (a toast in the NEOCORE host).
 * The host's own guards still protect the shell.
 *
 * @example
 * { path: 'new', canActivate: [permissionGuard('user', 'crear')], loadComponent: ... }
 */
export function permissionGuard(
  resource: string,
  action: string,
): CanActivateFn {
  return () => {
    if (inject(PermissionChecker).can(resource, action)) {
      return true;
    }
    inject(Notifier).warning(PERMISSION_DENIED_MESSAGE);
    return false;
  };
}
