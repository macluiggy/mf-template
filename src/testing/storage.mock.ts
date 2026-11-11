import type { Provider } from '@angular/core';

import { StorageService } from '../app/shared/services/storage.service';

/**
 * In-memory double of {@link StorageService}: same API, no encryption, each
 * method a `vi.fn` with the real behavior so specs can both seed data and
 * assert calls.
 */
export function createStorageMock(initial: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries(initial));
  return {
    deleteKeyStorage: vi.fn<StorageService['deleteKeyStorage']>((key) => {
      store.delete(key);
    }),
    getLocalStorage: vi.fn(
      <T = string>(key: string): T | undefined => store.get(key) as T,
    ),
    saveLocalStorage: vi.fn<StorageService['saveLocalStorage']>(
      (key, value) => {
        store.set(key, value);
      },
    ),
  };
}

export type StorageMock = ReturnType<typeof createStorageMock>;

/**
 * Provides a {@link StorageMock} in place of {@link StorageService}.
 *
 * @example
 * const { providers } = provideStorageMock({ ACCESS_TOKEN: 'token' });
 * TestBed.configureTestingModule({ providers });
 */
export function provideStorageMock(initial?: Record<string, unknown>): {
  mock: StorageMock;
  providers: Provider[];
} {
  const mock = createStorageMock(initial);
  return { mock, providers: [{ provide: StorageService, useValue: mock }] };
}
