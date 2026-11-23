import { HttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideNotifierMock } from '../../../testing';
import { AUTH_TOKEN_PROVIDER } from '../../core/auth-token';
import { provideAppHttpClient } from './http.providers';

describe('provideAppHttpClient', () => {
  it('still sends the Bearer token from AUTH_TOKEN_PROVIDER', () => {
    const { providers } = provideNotifierMock();
    TestBed.configureTestingModule({
      providers: [
        provideAppHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_TOKEN_PROVIDER, useValue: () => 'abc' },
        ...providers,
      ],
    });

    TestBed.inject(HttpClient).get('/api/resource').subscribe();
    const controller = TestBed.inject(HttpTestingController);
    const req = controller.expectOne('/api/resource');

    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({});
    controller.verify();
  });
});
