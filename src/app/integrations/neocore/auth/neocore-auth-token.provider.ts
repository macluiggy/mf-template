import type { KeyValueStorage } from '../../../core/key-value-storage';
import { StorageEnum } from '../storage/storage.enum';

/**
 * NEOCORE adapter for `AUTH_TOKEN_PROVIDER`: the access token the host stored
 * (encrypted) under `StorageEnum.ACCESS_TOKEN`.
 *
 * A factory so the token is read on every request, never cached: the host can
 * refresh or clear it at any time.
 */
export function neocoreAuthTokenProvider(
  storage: KeyValueStorage,
): () => string | null {
  return () => {
    const token = storage.get<string>(StorageEnum.ACCESS_TOKEN);
    return typeof token === 'string' ? token : null;
  };
}
