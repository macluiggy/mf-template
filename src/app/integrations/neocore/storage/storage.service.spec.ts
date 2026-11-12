import { TestBed } from '@angular/core/testing';
import { EncryptStorageNoble } from 'encrypt-storage';

import { environment } from '../../../../environments/environment';
import { StorageEnum } from './storage.enum';
import { StorageService } from './storage.service';

// The NEOCORE preset is optional, so the spec brings its own secret instead of
// relying on SECRET_KEY in .env (`bun run test` reads only .env.example).
const TEST_SECRET_KEY = 'test-secret-key-neocore';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    environment.secretKey = TEST_SECRET_KEY;
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [StorageService] });
    service = TestBed.inject(StorageService);
  });

  it('round-trips a value through encrypted localStorage', () => {
    service.saveLocalStorage(StorageEnum.ACCESS_TOKEN, 'token-123');

    expect(service.getLocalStorage(StorageEnum.ACCESS_TOKEN)).toBe('token-123');
    // Neither the key name nor the value is stored in clear text.
    expect(JSON.stringify(localStorage)).not.toContain('token-123');
    expect(localStorage.getItem(StorageEnum.ACCESS_TOKEN)).toBeNull();
  });

  it('reads a token written by the host with the same SECRET_KEY', () => {
    const host = new EncryptStorageNoble(TEST_SECRET_KEY);
    host.setItem(host.hash('ACCESS_TOKEN'), 'host-token');

    expect(service.getLocalStorage(StorageEnum.ACCESS_TOKEN)).toBe(
      'host-token',
    );
  });

  it('returns undefined for a missing key', () => {
    expect(service.getLocalStorage(StorageEnum.USER_SESSION)).toBeUndefined();
  });

  it('discards a value that cannot be decrypted', () => {
    const name = new EncryptStorageNoble(TEST_SECRET_KEY).hash('ACCESS_TOKEN');
    localStorage.setItem(name, 'not-a-valid-ciphertext-but-long-enough-to-try');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(service.getLocalStorage(StorageEnum.ACCESS_TOKEN)).toBeUndefined();
    expect(localStorage.getItem(name)).toBeNull();
    warn.mockRestore();
  });

  it('throws on first use when SECRET_KEY is not set', () => {
    const previous = environment.secretKey;
    environment.secretKey = undefined;
    try {
      expect(() => service.getLocalStorage(StorageEnum.ACCESS_TOKEN)).toThrow(
        /SECRET_KEY is not set/,
      );
    } finally {
      environment.secretKey = previous;
    }
  });

  it('removes a key', () => {
    service.saveLocalStorage(StorageEnum.ACCESS_TOKEN, 'token-123');
    service.deleteKeyStorage(StorageEnum.ACCESS_TOKEN);

    expect(service.getLocalStorage(StorageEnum.ACCESS_TOKEN)).toBeUndefined();
  });
});
