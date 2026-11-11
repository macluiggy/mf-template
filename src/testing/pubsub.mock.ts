import type { Provider } from '@angular/core';

import { PubSubService } from '../app/shared/services/pubsub.service';

/** Spy double of {@link PubSubService}: every public method is a `vi.fn`. */
export function createPubSubMock() {
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

export type PubSubMock = ReturnType<typeof createPubSubMock>;

/**
 * Provides a {@link PubSubMock} in place of {@link PubSubService}.
 *
 * @example
 * const { mock, providers } = providePubSubMock();
 * TestBed.configureTestingModule({ providers });
 * expect(mock.loading).toHaveBeenLastCalledWith(false);
 */
export function providePubSubMock(mock: PubSubMock = createPubSubMock()): {
  mock: PubSubMock;
  providers: Provider[];
} {
  return { mock, providers: [{ provide: PubSubService, useValue: mock }] };
}
