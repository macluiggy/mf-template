import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { EnvironmentProviders, Provider } from '@angular/core';

/**
 * HttpClient backed by Angular's testing backend, for service specs.
 *
 * @example
 * TestBed.configureTestingModule({ providers: [provideHttpTesting()] });
 * const http = TestBed.inject(HttpTestingController);
 * service.list().subscribe();
 * http.expectOne((req) => req.url.endsWith('/template')).flush(body);
 * http.verify();
 */
export function provideHttpTesting(): (Provider | EnvironmentProviders)[] {
  return [provideHttpClient(), provideHttpClientTesting()];
}
