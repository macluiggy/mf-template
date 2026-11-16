import { Injectable, inject } from '@angular/core';

import { KeyValueStorage } from '../../../core/key-value-storage';
import { StorageService } from './storage.service';

/**
 * NEOCORE adapter for {@link KeyValueStorage}: the encrypted localStorage
 * shared with the host (same SECRET_KEY, same key names).
 */
@Injectable()
export class EncryptedKeyValueStorage extends KeyValueStorage {
  private readonly storage = inject(StorageService);

  get<T>(key: string): T | undefined {
    return this.storage.getLocalStorage<T>(key);
  }

  remove(key: string): void {
    this.storage.deleteKeyStorage(key);
  }

  set(key: string, value: unknown): void {
    this.storage.saveLocalStorage(key, value);
  }
}
