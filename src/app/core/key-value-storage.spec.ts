import { TestBed } from '@angular/core/testing';

import {
  KeyValueStorage,
  LocalStorageKeyValueStorage,
  provideLocalStorageKeyValueStorage,
} from './key-value-storage';

describe('LocalStorageKeyValueStorage', () => {
  let storage: KeyValueStorage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideLocalStorageKeyValueStorage()],
    });
    storage = TestBed.inject(KeyValueStorage);
  });

  afterEach(() => vi.restoreAllMocks());

  it('binds the localStorage adapter to the KeyValueStorage port', () => {
    expect(storage).toBeInstanceOf(LocalStorageKeyValueStorage);
  });

  it('round-trips a JSON value in plain localStorage', () => {
    storage.set('USER_SESSION', { id: 1 });

    expect(storage.get('USER_SESSION')).toEqual({ id: 1 });
    expect(localStorage.getItem('USER_SESSION')).toBe('{"id":1}');
  });

  it('returns undefined for a missing key', () => {
    expect(storage.get('ACCESS_TOKEN')).toBeUndefined();
  });

  it('returns undefined for a value that is not valid JSON', () => {
    localStorage.setItem('BROKEN', '{not-json');

    expect(storage.get('BROKEN')).toBeUndefined();
  });

  it('drops a value that cannot be serialized without throwing', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;

    expect(() => storage.set('CIRCULAR', circular)).not.toThrow();
    expect(storage.get('CIRCULAR')).toBeUndefined();
  });

  it('removes a key', () => {
    storage.set('ACCESS_TOKEN', 'token-123');

    storage.remove('ACCESS_TOKEN');

    expect(storage.get('ACCESS_TOKEN')).toBeUndefined();
  });

  it('is fail-safe when the storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(storage.get('ACCESS_TOKEN')).toBeUndefined();
    expect(() => storage.set('ACCESS_TOKEN', 'token-123')).not.toThrow();
    expect(() => storage.remove('ACCESS_TOKEN')).not.toThrow();
  });
});
