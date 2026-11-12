import { Injectable } from '@angular/core';
import { EncryptStorageNoble } from 'encrypt-storage';

import { environment } from '../../../../environments/environment';
import type { StorageEnum } from './storage.enum';

/**
 * NEOCORE adapter over `encrypt-storage`, the same engine and key derivation
 * as the host and frontcore: the key name is `hash(name)` and the value is
 * AES-GCM encrypted, both with SECRET_KEY. If SECRET_KEY differs from the
 * host, every read silently returns undefined (the hashed names never match)
 * — keep it identical in every environment.
 *
 * The client is created on first use, never at module load: importing this
 * file must not require a valid SECRET_KEY.
 */
@Injectable()
export class StorageService {
  private client: EncryptStorageNoble | undefined;

  saveLocalStorage(key: StorageEnum | string, value: unknown): void {
    const client = this.encrypted();
    client.setItem(client.hash(key), value);
  }

  getLocalStorage<T = string>(key: StorageEnum | string): T | undefined {
    const client = this.encrypted();
    const name = client.hash(key);
    try {
      return client.getItem<T>(name) ?? undefined;
    } catch (err) {
      // Corrupt value, or written with another secret under the same name.
      const reason = (err as Error)?.message;
      console.warn(
        `[storage] "${key}" could not be decrypted and was discarded: ${reason}`,
      );
      client.removeItem(name);
      return undefined;
    }
  }

  deleteKeyStorage(key: StorageEnum | string): void {
    const client = this.encrypted();
    client.removeItem(client.hash(key));
  }

  private encrypted(): EncryptStorageNoble {
    this.client ??= new EncryptStorageNoble(environment.secretKey);
    return this.client;
  }
}
