import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { EnvironmentProviders } from '@angular/core';
import { authInterceptor } from '../interceptors/auth.interceptor';

/**
 * The single HttpClient configuration of this application, registered once in
 * `app.config.ts`. Add new functional interceptors to the list below.
 */
export function provideAppHttpClient(): EnvironmentProviders {
  return provideHttpClient(withInterceptors([authInterceptor]));
}
