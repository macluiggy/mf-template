import { Injectable } from '@angular/core';
import { EncryptStorageNoble } from 'encrypt-storage';
import { environment } from '../../../environments/environment';
import type { StorageEnum } from '../enums/storage.enum';

/**
 * Same engine and key derivation as the host and frontcore: the key name is
 * `hash(name)` and the value is AES-GCM encrypted, both with SECRET_KEY.
 * If SECRET_KEY differs from the host, every read silently returns undefined
 * (the hashed names never match) — keep it identical in every environment.
 */
const encryptStorage = new EncryptStorageNoble(environment.secretKey);

@Injectable({ providedIn: 'root' })
export class StorageService {
  saveLocalStorage(key: StorageEnum | string, value: string | null): void {
    encryptStorage.setItem(encryptStorage.hash(key), value);
  }

  getLocalStorage<T = string>(key: StorageEnum | string): T | undefined {
    const name = encryptStorage.hash(key);
    try {
      return encryptStorage.getItem<T>(name) ?? undefined;
    } catch (err) {
      // Corrupt value, or written with another secret under the same name.
      console.warn(
        `[storage] "${key}" could not be decrypted and was discarded: ${(err as Error)?.message}`,
      );
      encryptStorage.removeItem(name);
      return undefined;
    }
  }

  deleteKeyStorage(key: StorageEnum | string): void {
    encryptStorage.removeItem(encryptStorage.hash(key));
  }
}
