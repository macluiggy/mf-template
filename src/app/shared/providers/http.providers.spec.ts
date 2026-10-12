import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StorageEnum } from '../enums/storage.enum';
import { StorageService } from '../services/storage.service';
import { provideAppHttpClient } from './http.providers';

describe('provideAppHttpClient', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideAppHttpClient(), provideHttpClientTesting()],
    });
  });

  it('registers an HttpClient that runs the auth interceptor', () => {
    TestBed.inject(StorageService).saveLocalStorage(StorageEnum.ACCESS_TOKEN, 'abc');
    const controller = TestBed.inject(HttpTestingController);

    TestBed.inject(HttpClient).get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');

    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({});
    controller.verify();
  });
});
