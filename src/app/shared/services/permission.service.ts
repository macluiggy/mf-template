import { Injectable, inject } from '@angular/core';

import { StorageEnum } from '../enums/storage.enum';
import type { UserPermission } from '../interfaces/user-permission.interface';
import { StorageService } from './storage.service';

const WILDCARD = '*';

/**
 * True when `permission` allows `resource:action` and does not deny it.
 * A `resource:*` entry matches every action of the resource. A deny always
 * wins over an allow. A missing or malformed payload allows nothing.
 *
 * Same rule as the forks' `validPermissionResourceAction` (frontzohoadmin,
 * frontvirtualofficebroker, frontbills, mf-quality-management).
 */
export function isActionAllowed(
  permission: UserPermission | undefined,
  resource: string,
  action: string,
): boolean {
  const matches = (entry: string) =>
    entry === `${resource}:${action}` || entry === `${resource}:${WILDCARD}`;
  const allowed = permission?.allow?.action;
  const denied = permission?.denny?.action;
  if (!Array.isArray(allowed)) {
    return false;
  }
  if (Array.isArray(denied) && denied.some(matches)) {
    return false;
  }
  return allowed.some(matches);
}

/**
 * Answers "can the signed-in user do `action` on `resource`?" from the
 * permissions the host stored in encrypted localStorage. The role payload
 * (`ROLE_PERMISSION`) is checked first and the user payload (`PERMISSION`)
 * second; either one allowing it is enough. Without `ROLE_PERMISSION` this is
 * exactly the user-only check most forks use today.
 *
 * Only for showing or hiding UI: the gateway enforces the real permission
 * with the `x-api-key` header (`buildPermissionHeaders`).
 *
 * @example
 * readonly canCreate = inject(PermissionService).can('user', 'crear');
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly storage = inject(StorageService);

  can(resource: string, action: string): boolean {
    return [StorageEnum.ROLE_PERMISSION, StorageEnum.PERMISSION].some((key) =>
      isActionAllowed(
        this.storage.getLocalStorage<UserPermission>(key),
        resource,
        action,
      ),
    );
  }
}
