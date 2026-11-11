import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';

import { PermissionService } from '../services/permission.service';
import { PubSubService } from '../services/pubsub.service';

/** Shown in the host's warning toast when a route is blocked. */
export const PERMISSION_DENIED_MESSAGE =
  'No tiene permisos para acceder a esta opción.';

/**
 * Blocks a route of this remote unless the user can do `action` on
 * `resource`. On deny it keeps the user where they are and asks the host to
 * show a warning toast. The host's own guards still protect the shell.
 *
 * @example
 * { path: 'new', canActivate: [permissionGuard('user', 'crear')], loadComponent: ... }
 */
export function permissionGuard(
  resource: string,
  action: string,
): CanActivateFn {
  return () => {
    if (inject(PermissionService).can(resource, action)) {
      return true;
    }
    inject(PubSubService).warning(PERMISSION_DENIED_MESSAGE);
    return false;
  };
}
