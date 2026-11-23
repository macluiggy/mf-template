import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { KeyValueStorage } from '../app/core/key-value-storage';
import { Notifier } from '../app/core/notifier';
import {
  createNotifierMock,
  createStorageMock,
  provideHttpTesting,
  provideNotifierMock,
  provideStorageMock,
} from './index';

describe('test kit', () => {
  describe('createStorageMock', () => {
    it('round-trips a value through the in-memory store', () => {
      const storage = createStorageMock();

      storage.set('ACCESS_TOKEN', 'token-123');

      expect(storage.get('ACCESS_TOKEN')).toBe('token-123');
    });

    it('starts with the values it was seeded with', () => {
      const storage = createStorageMock({ ACCESS_TOKEN: 'seeded' });

      expect(storage.get('ACCESS_TOKEN')).toBe('seeded');
    });

    it('returns undefined for a missing key', () => {
      const storage = createStorageMock();

      expect(storage.get('USER_SESSION')).toBeUndefined();
    });

    it('removes a key', () => {
      const storage = createStorageMock({ ACCESS_TOKEN: 'token-123' });

      storage.remove('ACCESS_TOKEN');

      expect(storage.get('ACCESS_TOKEN')).toBeUndefined();
      expect(storage.remove).toHaveBeenCalledWith('ACCESS_TOKEN');
    });
  });

  describe('provideStorageMock', () => {
    it('replaces the KeyValueStorage port in the TestBed', () => {
      const { mock, providers } = provideStorageMock({
        ACCESS_TOKEN: 'token-123',
      });

      TestBed.configureTestingModule({ providers });
      const storage = TestBed.inject(KeyValueStorage);

      expect(storage.get('ACCESS_TOKEN')).toBe('token-123');
      expect(mock.set).not.toHaveBeenCalled();
    });
  });

  describe('createNotifierMock', () => {
    it('records the feedback the code asked for', () => {
      const notifier = createNotifierMock();

      notifier.loading(true);
      notifier.error('boom');

      expect(notifier.loading).toHaveBeenCalledWith(true);
      expect(notifier.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('provideNotifierMock', () => {
    it('replaces the Notifier port in the TestBed', () => {
      const { mock, providers } = provideNotifierMock();

      TestBed.configureTestingModule({ providers });
      const notifier = TestBed.inject(Notifier);

      notifier.warning('careful');

      expect(mock.warning).toHaveBeenCalledWith('careful');
    });
  });

  describe('provideHttpTesting', () => {
    it('lets a service request be flushed with the HttpTestingController', () => {
      TestBed.configureTestingModule({ providers: provideHttpTesting() });
      const http = TestBed.inject(HttpClient);
      const controller = TestBed.inject(HttpTestingController);
      let result: unknown;

      http.get('/api/users').subscribe((res) => (result = res));

      const request = controller.expectOne('/api/users');
      expect(request.request.method).toBe('GET');
      request.flush({ id: 1 });

      expect(result).toEqual({ id: 1 });
      controller.verify();
    });
  });
});
