import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PubSubService } from '../app/shared/services/pubsub.service';
import { StorageService } from '../app/shared/services/storage.service';
import { provideHttpTesting } from './http.testing';
import { createPubSubMock, providePubSubMock } from './pubsub.mock';
import { createStorageMock, provideStorageMock } from './storage.mock';

describe('test kit', () => {
  describe('createStorageMock', () => {
    it('round-trips a value through the in-memory store', () => {
      const storage = createStorageMock();

      storage.saveLocalStorage('ACCESS_TOKEN', 'token-123');

      expect(storage.getLocalStorage('ACCESS_TOKEN')).toBe('token-123');
    });

    it('starts with the values it was seeded with', () => {
      const storage = createStorageMock({ ACCESS_TOKEN: 'seeded' });

      expect(storage.getLocalStorage('ACCESS_TOKEN')).toBe('seeded');
    });

    it('returns undefined for a missing key', () => {
      const storage = createStorageMock();

      expect(storage.getLocalStorage('USER_SESSION')).toBeUndefined();
    });

    it('removes a key', () => {
      const storage = createStorageMock({ ACCESS_TOKEN: 'token-123' });

      storage.deleteKeyStorage('ACCESS_TOKEN');

      expect(storage.getLocalStorage('ACCESS_TOKEN')).toBeUndefined();
      expect(storage.deleteKeyStorage).toHaveBeenCalledWith('ACCESS_TOKEN');
    });
  });

  describe('provideStorageMock', () => {
    it('replaces the storage service in the TestBed', () => {
      const { mock, providers } = provideStorageMock({
        ACCESS_TOKEN: 'token-123',
      });

      TestBed.configureTestingModule({ providers });
      const service = TestBed.inject(StorageService);

      expect(service.getLocalStorage('ACCESS_TOKEN')).toBe('token-123');
      expect(mock.saveLocalStorage).not.toHaveBeenCalled();
    });
  });

  describe('createPubSubMock', () => {
    it('records what the page published to the host', () => {
      const pubsub = createPubSubMock();

      pubsub.loading(true);
      pubsub.error('boom');

      expect(pubsub.loading).toHaveBeenCalledWith(true);
      expect(pubsub.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('providePubSubMock', () => {
    it('replaces the pubsub service in the TestBed', () => {
      const { mock, providers } = providePubSubMock();

      TestBed.configureTestingModule({ providers });
      const service = TestBed.inject(PubSubService);

      service.loading(true);

      expect(mock.loading).toHaveBeenCalledWith(true);
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
