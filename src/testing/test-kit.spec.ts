import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PubSubService } from '../app/shared/services/pubsub.service';
import { StorageService } from '../app/shared/services/storage.service';
import {
  provideHttpTesting,
  providePubSubMock,
  provideStorageMock,
} from './index';

describe('test kit', () => {
  it('storage double round-trips and deletes values', () => {
    const { mock, providers } = provideStorageMock({ ACCESS_TOKEN: 'seed' });
    TestBed.configureTestingModule({ providers });
    const storage = TestBed.inject(StorageService);

    expect(storage.getLocalStorage('ACCESS_TOKEN')).toBe('seed');
    storage.saveLocalStorage('USER_SESSION', 'session');
    expect(storage.getLocalStorage('USER_SESSION')).toBe('session');
    storage.deleteKeyStorage('USER_SESSION');
    expect(storage.getLocalStorage('USER_SESSION')).toBeUndefined();
    expect(mock.saveLocalStorage).toHaveBeenCalledWith(
      'USER_SESSION',
      'session',
    );
  });

  it('pubsub mock records the calls a component makes', () => {
    const { mock, providers } = providePubSubMock();
    TestBed.configureTestingModule({ providers });

    TestBed.inject(PubSubService).loading(true);
    TestBed.inject(PubSubService).error('boom');

    expect(mock.loading).toHaveBeenCalledWith(true);
    expect(mock.error).toHaveBeenCalledWith('boom');
  });

  it('provideHttpTesting lets a request be flushed', () => {
    TestBed.configureTestingModule({ providers: [provideHttpTesting()] });
    const http = TestBed.inject(HttpTestingController);
    let body: unknown;

    TestBed.inject(HttpClient)
      .get('/api/ping')
      .subscribe((value) => (body = value));
    http.expectOne('/api/ping').flush({ ok: true });

    expect(body).toEqual({ ok: true });
    http.verify();
  });
});
