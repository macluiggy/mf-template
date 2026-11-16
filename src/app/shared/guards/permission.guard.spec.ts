import { TestBed } from '@angular/core/testing';
import type {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

import { createNotifierMock } from '../../../testing';
import { Notifier } from '../../core/notifier';
import { PermissionChecker } from '../../core/permission-checker';
import { PERMISSION_DENIED_MESSAGE, permissionGuard } from './permission.guard';

function run(can: boolean) {
  const notifier = createNotifierMock();
  TestBed.configureTestingModule({
    providers: [
      { provide: PermissionChecker, useValue: { can: () => can } },
      { provide: Notifier, useValue: notifier },
    ],
  });
  const result = TestBed.runInInjectionContext(() =>
    permissionGuard('user', 'crear')(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    ),
  );
  return { notifier, result };
}

describe('permissionGuard', () => {
  it('lets the route through when the user has the permission', () => {
    const { notifier, result } = run(true);

    expect(result).toBe(true);
    expect(notifier.warning).not.toHaveBeenCalled();
  });

  it('blocks the route and warns the user when it is missing', () => {
    const { notifier, result } = run(false);

    expect(result).toBe(false);
    expect(notifier.warning).toHaveBeenCalledWith(PERMISSION_DENIED_MESSAGE);
  });
});
