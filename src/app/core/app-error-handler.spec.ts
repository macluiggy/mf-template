import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideNotifierMock } from '../../testing';
import { provideAppErrorHandler } from './app-error-handler';

function setup() {
  const { mock: notifier, providers } = provideNotifierMock();
  TestBed.configureTestingModule({
    providers: [provideAppErrorHandler(), ...providers],
  });
  const consoleError = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  return {
    consoleError,
    handler: TestBed.inject(ErrorHandler),
    notifier,
  };
}

describe('AppErrorHandler', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs a plain Error and notifies the user once', () => {
    const { consoleError, handler, notifier } = setup();

    handler.handleError(new Error('boom'));

    expect(consoleError).toHaveBeenCalledOnce();
    expect(notifier.error).toHaveBeenCalledOnce();
    expect(notifier.error).toHaveBeenCalledWith('boom');
  });

  it('only logs an HttpErrorResponse, which the HTTP interceptor owns', () => {
    const { consoleError, handler, notifier } = setup();

    handler.handleError(
      new HttpErrorResponse({ status: 500, statusText: 'Server Error' }),
    );

    expect(consoleError).toHaveBeenCalledOnce();
    expect(notifier.error).not.toHaveBeenCalled();
  });
});
