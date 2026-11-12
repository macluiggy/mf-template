import { type Provider } from '@angular/core';
import type { Mock, MockInstance } from 'vitest';

import { KeyValueStorage } from '../app/core/key-value-storage';

/**
 * `KeyValueStorage.get` is generic, and Vitest's `Mock` erases the type
 * parameter. Keeping the original signature next to the mock instance
 * preserves it: `mock.get<string>('ACCESS_TOKEN')` is a `string`.
 */
type KeyValueGetter = KeyValueStorage['get'];

/**
 * In-memory double of {@link KeyValueStorage}: the same three methods, backed
 * by a `Map` instead of a real storage.
 */
export type StorageMock = {
  get: KeyValueGetter & MockInstance<KeyValueGetter>;
  remove: Mock<KeyValueStorage['remove']>;
  set: Mock<KeyValueStorage['set']>;
};

/**
 * Creates a {@link StorageMock}. `initial` seeds the store, so a spec can
 * start with a token or a session already written by the host.
 *
 * @example
 * const storage = createStorageMock({ ACCESS_TOKEN: 'token-123' });
 * expect(storage.get('ACCESS_TOKEN')).toBe('token-123');
 */
export function createStorageMock(
  initial: Partial<Record<string, unknown>> = {},
): StorageMock {
  const store = new Map<string, unknown>(Object.entries(initial));

  return {
    get: vi.fn<KeyValueGetter>(
      <T>(key: string): T | undefined => store.get(key) as T | undefined,
    ) as StorageMock['get'],
    remove: vi.fn<KeyValueStorage['remove']>((key) => {
      store.delete(key);
    }),
    set: vi.fn<KeyValueStorage['set']>((key, value) => {
      store.set(key, value);
    }),
  };
}

/**
 * Replaces {@link KeyValueStorage} in a TestBed with the in-memory double.
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
    providers: [{ provide: KeyValueStorage, useValue: mock }],
  };
}
