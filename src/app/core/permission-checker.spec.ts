import { TestBed } from '@angular/core/testing';

import {
  AllowAllPermissionChecker,
  PermissionChecker,
  provideAllowAllPermissionChecker,
} from './permission-checker';

describe('AllowAllPermissionChecker', () => {
  it('allows every resource and action', () => {
    const checker = new AllowAllPermissionChecker();

    expect(checker.can('user', 'crear')).toBe(true);
    expect(checker.can('anything', 'at-all')).toBe(true);
  });

  it('binds the allow-all adapter to the PermissionChecker port', () => {
    TestBed.configureTestingModule({
      providers: [provideAllowAllPermissionChecker()],
    });

    expect(TestBed.inject(PermissionChecker)).toBeInstanceOf(
      AllowAllPermissionChecker,
    );
  });
});
