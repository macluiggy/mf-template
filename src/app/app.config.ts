import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAppCore } from './core/app-core.providers';
import { provideAppLocale } from './core/app-locale';
import { provideNeocoreHost } from './integrations/neocore/neocore.providers';
import { provideAppHttpClient } from './shared/providers/http.providers';

// Standalone-dev configuration only: the host never executes this file.
// Anything the exposed routes need at runtime must also be in their providers.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppCore(),
    provideAppLocale(),
    provideAppHttpClient(),
    // NEOCORE host adapters: delete this line and src/app/integrations/neocore/.
    provideNeocoreHost(),
  ],
};
