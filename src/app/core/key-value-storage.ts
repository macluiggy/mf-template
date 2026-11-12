import type { Provider } from '@angular/core';
import { Injectable } from '@angular/core';

/**
 * Small key/value storage port (token, session, permissions).
 *
 * The default adapter is plain `window.localStorage`; `provideNeocoreHost()`
 * replaces it with the encrypted storage shared with the host. Generic code
 * never imports the encryption library.
 */
export abstract class KeyValueStorage {
  /** The stored value, or `undefined` when the key is missing or unreadable. */
  abstract get<T>(key: string): T | undefined;

  /** Stores `value` under `key`; failures never throw. */
  abstract set(key: string, value: unknown): void;

  /** Deletes `key`; a missing key is not an error. */
  abstract remove(key: string): void;
}

/**
 * Default adapter: JSON in `window.localStorage`.
 *
 * Every access is fail-safe (private mode, blocked storage, quota, SSR): a
 * failed read behaves like a missing key and a failed write is dropped, so the
 * app keeps working without storage.
 */
@Injectable()
export class LocalStorageKeyValueStorage extends KeyValueStorage {
  get<T>(key: string): T | undefined {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? undefined : (JSON.parse(raw) as T);
    } catch {
      return undefined;
    }
  }

  set(key: string, value: unknown): void {
    try {
      const serialized = JSON.stringify(value);
      if (serialized === undefined) {
        return;
      }
      window.localStorage.setItem(key, serialized);
    } catch {
      // Storage unavailable, full or the value is not serializable: the app
      // keeps working without it.
    }
  }

  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Nothing to do: the key is already unreachable.
    }
  }
}

/** Binds the plain-localStorage adapter to the {@link KeyValueStorage} port. */
export function provideLocalStorageKeyValueStorage(): Provider {
  return { provide: KeyValueStorage, useClass: LocalStorageKeyValueStorage };
}
