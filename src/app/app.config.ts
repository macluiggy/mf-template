import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideMfHttpClient } from './shared/providers/http.providers';

// Standalone-dev configuration only: the host never executes this file.
// Anything the exposed routes need at runtime must also be in their providers.
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes), provideMfHttpClient()],
};
