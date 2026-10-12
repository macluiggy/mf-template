import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StorageEnum } from '../enums/storage.enum';
import { StorageService } from '../services/storage.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(StorageService);
  });

  afterEach(() => controller.verify());

  it('adds the Bearer token stored by the host and the device info header', () => {
    storage.saveLocalStorage(StorageEnum.ACCESS_TOKEN, 'abc');

    http.get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');

    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    expect(req.request.headers.get('x-device-info')).toContain('userAgent');
    req.flush({});
  });

  it('does not add Authorization when there is no usable token', () => {
    storage.saveLocalStorage(StorageEnum.ACCESS_TOKEN, 'undefined');

    http.get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');

    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.headers.has('x-device-info')).toBe(true);
    req.flush({});
  });

  it('keeps an explicit Authorization header set by the caller', () => {
    storage.saveLocalStorage(StorageEnum.ACCESS_TOKEN, 'abc');

    http.get('/api/resource', { headers: { Authorization: 'Bearer custom' } }).subscribe();
    const req = controller.expectOne('/api/resource');

    expect(req.request.headers.get('Authorization')).toBe('Bearer custom');
    req.flush({});
  });
});
