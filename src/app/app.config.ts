import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAppCore } from './core/app-core.providers';
import { provideAppLocale } from './core/app-locale';
import { provideAppHttpClient } from './shared/providers/http.providers';
import { provideTemplatePreset } from './template-preset';

// Standalone-dev configuration only: the host never executes this file.
// Anything the exposed routes need at runtime must also be in their providers.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppCore(),
    // TEMPLATE_PRESET decides the adapters: after provideAppCore(), overrides.
    provideTemplatePreset(),
    provideAppLocale(),
    provideAppHttpClient(),
  ],
};
