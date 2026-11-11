import { type Provider } from '@angular/core';
import type { Mock, MockInstance } from 'vitest';

import { StorageEnum } from '../app/shared/enums/storage.enum';
import { StorageService } from '../app/shared/services/storage.service';

/**
 * `StorageService.getLocalStorage` is generic, and Vitest's `Mock` erases the
 * type parameter. Keeping the original signature next to the mock instance
 * preserves it: `mock.getLocalStorage<string>('ACCESS_TOKEN')` is a `string`.
 */
type StorageGetter = StorageService['getLocalStorage'];

/**
 * In-memory double of {@link StorageService}: the same three methods, backed
 * by a `Map` instead of the encrypted localStorage.
 */
export type StorageMock = {
  deleteKeyStorage: Mock<StorageService['deleteKeyStorage']>;
  getLocalStorage: StorageGetter & MockInstance<StorageGetter>;
  saveLocalStorage: Mock<StorageService['saveLocalStorage']>;
};

/**
 * Creates a {@link StorageMock}. `initial` seeds the store, so a spec can
 * start with a token or a session already written by the host.
 *
 * @example
 * const storage = createStorageMock({ ACCESS_TOKEN: 'token-123' });
 * expect(storage.getLocalStorage('ACCESS_TOKEN')).toBe('token-123');
 */
export function createStorageMock(
  initial: Partial<Record<string, unknown>> = {},
): StorageMock {
  const store = new Map<string, unknown>(Object.entries(initial));

  return {
    deleteKeyStorage: vi.fn<StorageService['deleteKeyStorage']>((key) => {
      store.delete(key);
    }),
    getLocalStorage: vi.fn<StorageGetter>(
      <T = string>(key: StorageEnum | string): T | undefined =>
        store.get(key) as T | undefined,
    ) as StorageMock['getLocalStorage'],
    saveLocalStorage: vi.fn<StorageService['saveLocalStorage']>(
      (key, value) => {
        store.set(key, value);
      },
    ),
  };
}

/**
 * Replaces {@link StorageService} in a TestBed with the in-memory double.
 *
 * @example
 * const { mock, providers } = provideStorageMock({ ACCESS_TOKEN: 'abc' });
 * TestBed.configureTestingModule({ providers });
 */
export function provideStorageMock(
  initial: Partial<Record<string, unknown>> = {},
): { mock: StorageMock; providers: Provider[] } {
  const mock = createStorageMock(initial);

  return {
    mock,
    providers: [{ provide: StorageService, useValue: mock }],
  };
}
