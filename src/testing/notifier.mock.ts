import { type Provider } from '@angular/core';
import type { Mock } from 'vitest';

import { Notifier } from '../app/core/notifier';

/**
 * Spy for every method of the {@link Notifier} port, so a spec can assert the
 * feedback the code asked for (loader, toasts).
 */
export type NotifierMock = {
  error: Mock<Notifier['error']>;
  info: Mock<Notifier['info']>;
  loading: Mock<Notifier['loading']>;
  success: Mock<Notifier['success']>;
  warning: Mock<Notifier['warning']>;
};

/**
 * Creates a {@link NotifierMock}.
 *
 * @example
 * const notifier = createNotifierMock();
 * notifier.loading(true);
 * expect(notifier.loading).toHaveBeenCalledWith(true);
 */
export function createNotifierMock(): NotifierMock {
  return {
    error: vi.fn<Notifier['error']>(),
    info: vi.fn<Notifier['info']>(),
    loading: vi.fn<Notifier['loading']>(),
    success: vi.fn<Notifier['success']>(),
    warning: vi.fn<Notifier['warning']>(),
  };
}

/**
 * Replaces {@link Notifier} in a TestBed with a spy.
 *
 * @example
 * const { mock, providers } = provideNotifierMock();
 * TestBed.configureTestingModule({ providers });
 * expect(mock.error).toHaveBeenCalledWith('boom');
 */
export function provideNotifierMock(
  mock: NotifierMock = createNotifierMock(),
): {
  mock: NotifierMock;
  providers: Provider[];
} {
  return {
    mock,
    providers: [{ provide: Notifier, useValue: mock }],
  };
}
