import { Injectable, inject } from '@angular/core';

import { KeyValueStorage } from '../../../core/key-value-storage';
import { PermissionChecker } from '../../../core/permission-checker';
import { StorageEnum } from '../storage/storage.enum';
import type { UserPermission } from './user-permission.interface';

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
 * NEOCORE adapter for {@link PermissionChecker}: answers from the permissions
 * the host stored under `ROLE_PERMISSION` (role) and `PERMISSION` (user).
 * The role payload is checked first and the user payload second; either one
 * allowing it is enough.
 *
 * Only for showing or hiding UI: the gateway enforces the real permission
 * with the `x-api-key` header (`buildPermissionHeaders`).
 */
@Injectable()
export class NeocorePermissionChecker extends PermissionChecker {
  private readonly storage = inject(KeyValueStorage);

  can(resource: string, action: string): boolean {
    return [StorageEnum.ROLE_PERMISSION, StorageEnum.PERMISSION].some((key) =>
      isActionAllowed(this.storage.get<UserPermission>(key), resource, action),
    );
  }
}
