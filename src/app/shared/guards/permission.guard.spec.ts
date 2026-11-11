import { TestBed } from '@angular/core/testing';
import type {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

import { PubSubService } from '../services/pubsub.service';
import { StorageService } from '../services/storage.service';
import { PERMISSION_DENIED_MESSAGE, permissionGuard } from './permission.guard';

function run(stored: Record<string, unknown>) {
  const pubsub = { warning: vi.fn<PubSubService['warning']>() };
  TestBed.configureTestingModule({
    providers: [
      { provide: PubSubService, useValue: pubsub },
      {
        provide: StorageService,
        useValue: { getLocalStorage: (key: string) => stored[key] },
      },
    ],
  });
  const result = TestBed.runInInjectionContext(() =>
    permissionGuard('user', 'crear')(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    ),
  );
  return { pubsub, result };
}

describe('permissionGuard', () => {
  it('lets the route through when the user has the permission', () => {
    const { pubsub, result } = run({
      PERMISSION: {
        allow: { action: ['user:crear'] },
        denny: { action: [] },
        resource: ['user'],
      },
    });
    expect(result).toBe(true);
    expect(pubsub.warning).not.toHaveBeenCalled();
  });

  it('blocks the route and warns the host when it is missing', () => {
    const { pubsub, result } = run({});
    expect(result).toBe(false);
    expect(pubsub.warning).toHaveBeenCalledWith(PERMISSION_DENIED_MESSAGE);
  });
});
