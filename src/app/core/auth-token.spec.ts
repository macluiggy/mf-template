import { TestBed } from '@angular/core/testing';

import { AUTH_TOKEN_PROVIDER, provideNullAuthToken } from './auth-token';

describe('AUTH_TOKEN_PROVIDER', () => {
  it('returns null by default', () => {
    TestBed.configureTestingModule({});

    expect(TestBed.inject(AUTH_TOKEN_PROVIDER)()).toBeNull();
  });

  it('binds the null provider explicitly through provideNullAuthToken', () => {
    TestBed.configureTestingModule({ providers: [provideNullAuthToken()] });

    expect(TestBed.inject(AUTH_TOKEN_PROVIDER)()).toBeNull();
  });
});
