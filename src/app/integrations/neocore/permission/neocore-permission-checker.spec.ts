import { TestBed } from '@angular/core/testing';

import { provideStorageMock } from '../../../../testing';
import {
  NeocorePermissionChecker,
  isActionAllowed,
} from './neocore-permission-checker';
import type { UserPermission } from './user-permission.interface';

const permission = (allow: string[], denny: string[] = []): UserPermission => ({
  allow: { action: allow },
  denny: { action: denny },
  resource: [],
});

describe('isActionAllowed', () => {
  it('allows an exact resource:action', () => {
    expect(isActionAllowed(permission(['user:crear']), 'user', 'crear')).toBe(
      true,
    );
  });

  it('allows any action with resource:*', () => {
    expect(isActionAllowed(permission(['user:*']), 'user', 'borrar')).toBe(
      true,
    );
  });

  it('lets a deny win over an allow, exact or wildcard', () => {
    expect(
      isActionAllowed(
        permission(['user:*'], ['user:borrar']),
        'user',
        'borrar',
      ),
    ).toBe(false);
    expect(
      isActionAllowed(permission(['user:crear'], ['user:*']), 'user', 'crear'),
    ).toBe(false);
  });

  it('does not match another resource with the same prefix', () => {
    expect(isActionAllowed(permission(['users:*']), 'user', 'crear')).toBe(
      false,
    );
  });

  it('allows nothing for a missing or malformed payload', () => {
    expect(isActionAllowed(undefined, 'user', 'crear')).toBe(false);
    expect(isActionAllowed({} as UserPermission, 'user', 'crear')).toBe(false);
  });
});

function setup(stored: Record<string, unknown>) {
  const { providers } = provideStorageMock(stored);
  TestBed.configureTestingModule({
    providers: [NeocorePermissionChecker, ...providers],
  });
  return TestBed.inject(NeocorePermissionChecker);
}

describe('NeocorePermissionChecker', () => {
  it('uses the user PERMISSION when there is no ROLE_PERMISSION', () => {
    const checker = setup({ PERMISSION: permission(['user:crear']) });
    expect(checker.can('user', 'crear')).toBe(true);
    expect(checker.can('user', 'borrar')).toBe(false);
  });

  it('allows when the role allows even if the user payload does not', () => {
    const checker = setup({
      PERMISSION: permission([]),
      ROLE_PERMISSION: permission(['user:*']),
    });
    expect(checker.can('user', 'borrar')).toBe(true);
  });

  it('denies when nothing is stored', () => {
    expect(setup({}).can('user', 'crear')).toBe(false);
  });
});
