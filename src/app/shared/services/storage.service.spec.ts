import { TestBed } from '@angular/core/testing';
import { EncryptStorageNoble } from 'encrypt-storage';
import { environment } from '../../../environments/environment';
import { StorageEnum } from '../enums/storage.enum';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('round-trips a value through encrypted localStorage', () => {
    service.saveLocalStorage(StorageEnum.ACCESS_TOKEN, 'token-123');

    expect(service.getLocalStorage(StorageEnum.ACCESS_TOKEN)).toBe('token-123');
    // Neither the key name nor the value is stored in clear text.
    expect(JSON.stringify(localStorage)).not.toContain('token-123');
    expect(localStorage.getItem(StorageEnum.ACCESS_TOKEN)).toBeNull();
  });

  it('reads a value written by another encrypt-storage instance with the same SECRET_KEY', () => {
    const other = new EncryptStorageNoble(environment.secretKey);
    other.setItem(other.hash('ACCESS_TOKEN'), 'other-token');

    expect(service.getLocalStorage(StorageEnum.ACCESS_TOKEN)).toBe('other-token');
  });

  it('returns undefined for a missing key', () => {
    expect(service.getLocalStorage(StorageEnum.USER_SESSION)).toBeUndefined();
  });

  it('discards a value that cannot be decrypted', () => {
    const name = new EncryptStorageNoble(environment.secretKey).hash('ACCESS_TOKEN');
    localStorage.setItem(name, 'not-a-valid-ciphertext-but-long-enough-to-try');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(service.getLocalStorage(StorageEnum.ACCESS_TOKEN)).toBeUndefined();
    expect(localStorage.getItem(name)).toBeNull();
    warn.mockRestore();
  });

  it('removes a key', () => {
    service.saveLocalStorage(StorageEnum.ACCESS_TOKEN, 'token-123');
    service.deleteKeyStorage(StorageEnum.ACCESS_TOKEN);

    expect(service.getLocalStorage(StorageEnum.ACCESS_TOKEN)).toBeUndefined();
  });
});
