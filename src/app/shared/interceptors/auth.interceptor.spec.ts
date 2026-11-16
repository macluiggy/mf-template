import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AUTH_TOKEN_PROVIDER } from '../../core/auth-token';
import { authInterceptor } from './auth.interceptor';

function setup(tokenProvider?: () => string | null) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      ...(tokenProvider
        ? [{ provide: AUTH_TOKEN_PROVIDER, useValue: tokenProvider }]
        : []),
    ],
  });

  return {
    controller: TestBed.inject(HttpTestingController),
    http: TestBed.inject(HttpClient),
  };
}

describe('authInterceptor', () => {
  it('adds the Bearer token returned by the port', () => {
    const { controller, http } = setup(() => 'abc');

    http.get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');

    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({});
    controller.verify();
  });

  it('sends no Authorization header with the default null token provider', () => {
    const { controller, http } = setup();

    http.get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');

    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    controller.verify();
  });

  it.each([null, '', '   ', 'undefined', 'null'])(
    'ignores the unusable token %j',
    (token) => {
      const { controller, http } = setup(() => token);

      http.get('/api/resource').subscribe();
      const req = controller.expectOne('/api/resource');

      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
      controller.verify();
    },
  );

  it('keeps an explicit Authorization header set by the caller', () => {
    const { controller, http } = setup(() => 'abc');

    http
      .get('/api/resource', { headers: { Authorization: 'Bearer custom' } })
      .subscribe();
    const req = controller.expectOne('/api/resource');

    expect(req.request.headers.get('Authorization')).toBe('Bearer custom');
    req.flush({});
    controller.verify();
  });

  it('adds no host-specific header', () => {
    const { controller, http } = setup(() => 'abc');

    http.get('/api/resource').subscribe();
    const req = controller.expectOne('/api/resource');

    expect(req.request.headers.has('x-device-info')).toBe(false);
    req.flush({});
    controller.verify();
  });
});
