import { type Provider } from '@angular/core';
import type { Mock } from 'vitest';

import { PubSubService } from '../app/shared/services/pubsub.service';

/**
 * Spy for every public method of {@link PubSubService}, so a spec can assert
 * what the page published to the host (loader, toasts).
 */
export type PubSubMock = {
  error: Mock<PubSubService['error']>;
  info: Mock<PubSubService['info']>;
  loading: Mock<PubSubService['loading']>;
  publish: Mock<PubSubService['publish']>;
  publishSync: Mock<PubSubService['publishSync']>;
  success: Mock<PubSubService['success']>;
  warning: Mock<PubSubService['warning']>;
};

/**
 * Creates a {@link PubSubMock}. The methods that publish to the host return
 * `true`, like the real service does when the topic has subscribers.
 *
 * @example
 * const pubsub = createPubSubMock();
 * pubsub.loading(true);
 * expect(pubsub.loading).toHaveBeenCalledWith(true);
 */
export function createPubSubMock(): PubSubMock {
  return {
    error: vi.fn<PubSubService['error']>(),
    info: vi.fn<PubSubService['info']>(),
    loading: vi.fn<PubSubService['loading']>(),
    publish: vi.fn<PubSubService['publish']>(() => true),
    publishSync: vi.fn<PubSubService['publishSync']>(() => true),
    success: vi.fn<PubSubService['success']>(),
    warning: vi.fn<PubSubService['warning']>(),
  };
}

/**
 * Replaces {@link PubSubService} in a TestBed with a spy.
 *
 * @example
 * const { mock, providers } = providePubSubMock();
 * TestBed.configureTestingModule({ providers });
 * expect(mock.error).toHaveBeenCalledWith('boom');
 */
export function providePubSubMock(mock: PubSubMock = createPubSubMock()): {
  mock: PubSubMock;
  providers: Provider[];
} {
  return {
    mock,
    providers: [{ provide: PubSubService, useValue: mock }],
  };
}
