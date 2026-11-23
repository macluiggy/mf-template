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

import { environment } from '../../../environments/environment';
import {
  REQUEST_ID_HEADER,
  requestIdInterceptor,
} from './request-id.interceptor';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([requestIdInterceptor])),
      provideHttpClientTesting(),
    ],
  });
  return {
    controller: TestBed.inject(HttpTestingController),
    http: TestBed.inject(HttpClient),
  };
}

describe('requestIdInterceptor', () => {
  it('adds an x-request-id UUID to a request to apiUrl', () => {
    const { controller, http } = setup();

    http.get(`${environment.apiUrl}/users`).subscribe();
    const req = controller.expectOne(`${environment.apiUrl}/users`);

    expect(req.request.headers.get(REQUEST_ID_HEADER)).toMatch(UUID);
    req.flush({});
    controller.verify();
  });

  it('gives every request a different id', () => {
    const { controller, http } = setup();

    http.get(`${environment.apiUrl}/users`).subscribe();
    http.get(`${environment.apiUrl}/users`).subscribe();
    const [first, second] = controller.match(`${environment.apiUrl}/users`);

    expect(first.request.headers.get(REQUEST_ID_HEADER)).not.toBe(
      second.request.headers.get(REQUEST_ID_HEADER),
    );
    first.flush({});
    second.flush({});
    controller.verify();
  });

  it('keeps an existing x-request-id header', () => {
    const { controller, http } = setup();

    http
      .get(`${environment.apiUrl}/users`, {
        headers: { [REQUEST_ID_HEADER]: 'caller-id' },
      })
      .subscribe();
    const req = controller.expectOne(`${environment.apiUrl}/users`);

    expect(req.request.headers.get(REQUEST_ID_HEADER)).toBe('caller-id');
    req.flush({});
    controller.verify();
  });

  it('adds nothing to another origin', () => {
    const { controller, http } = setup();

    http.get('https://example.com/data').subscribe();
    const req = controller.expectOne('https://example.com/data');

    expect(req.request.headers.has(REQUEST_ID_HEADER)).toBe(false);
    req.flush({});
    controller.verify();
  });
});
