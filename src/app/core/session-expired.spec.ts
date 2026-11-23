import { TestBed } from '@angular/core/testing';

import {
  SESSION_EXPIRED_HANDLER,
  type SessionExpiredHandler,
  provideSessionExpiredHandler,
} from './session-expired';

describe('SESSION_EXPIRED_HANDLER', () => {
  it('defaults to a no-op handler', () => {
    TestBed.configureTestingModule({});

    const handler = TestBed.inject(SESSION_EXPIRED_HANDLER);

    expect(() => handler()).not.toThrow();
  });

  it('binds the handler passed to provideSessionExpiredHandler', () => {
    const onExpired = vi.fn<SessionExpiredHandler>();
    TestBed.configureTestingModule({
      providers: [provideSessionExpiredHandler(onExpired)],
    });

    TestBed.inject(SESSION_EXPIRED_HANDLER)();

    expect(onExpired).toHaveBeenCalledOnce();
  });
});
