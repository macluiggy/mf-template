import {
  HttpContext,
  HttpErrorResponse,
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideNotifierMock } from '../../../testing';
import { SESSION_EXPIRED_HANDLER } from '../../core/session-expired';
import type { SessionExpiredHandler } from '../../core/session-expired';
import {
  SKIP_ERROR_NOTIFICATION,
  errorNotificationInterceptor,
} from './error-notification.interceptor';

function setup() {
  const { mock: notifier, providers } = provideNotifierMock();
  const sessionExpired = vi.fn<SessionExpiredHandler>();

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([errorNotificationInterceptor])),
      provideHttpClientTesting(),
      { provide: SESSION_EXPIRED_HANDLER, useValue: sessionExpired },
      ...providers,
    ],
  });

  return {
    controller: TestBed.inject(HttpTestingController),
    http: TestBed.inject(HttpClient),
    notifier,
    sessionExpired,
  };
}

describe('errorNotificationInterceptor', () => {
  it('notifies the envelope message once and rethrows the error', () => {
    const { controller, http, notifier } = setup();
    let received: unknown;

    http.get('/api/resource').subscribe({
      error: (error) => {
        received = error;
      },
    });
    controller
      .expectOne('/api/resource')
      .flush(
        { message: 'The record does not exist.' },
        { status: 404, statusText: 'Not Found' },
      );

    expect(notifier.error).toHaveBeenCalledOnce();
    expect(notifier.error).toHaveBeenCalledWith('The record does not exist.');
    expect(received).toBeInstanceOf(HttpErrorResponse);
    controller.verify();
  });

  it('does not notify a request that opted out with the context token', () => {
    const { controller, http, notifier } = setup();
    let received: unknown;

    http
      .get('/api/resource', {
        context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true),
      })
      .subscribe({
        error: (error) => {
          received = error;
        },
      });
    controller
      .expectOne('/api/resource')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(notifier.error).not.toHaveBeenCalled();
    expect(received).toBeInstanceOf(HttpErrorResponse);
    controller.verify();
  });

  it('calls the session expired handler once on a 401', () => {
    const { controller, http, sessionExpired } = setup();

    http.get('/api/resource').subscribe({ error: () => undefined });
    controller
      .expectOne('/api/resource')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(sessionExpired).toHaveBeenCalledOnce();
    controller.verify();
  });

  it('notifies nothing on a successful response', () => {
    const { controller, http, notifier, sessionExpired } = setup();

    http.get('/api/resource').subscribe();
    controller.expectOne('/api/resource').flush({ data: [], message: 'ok' });

    expect(notifier.error).not.toHaveBeenCalled();
    expect(sessionExpired).not.toHaveBeenCalled();
    controller.verify();
  });
});
