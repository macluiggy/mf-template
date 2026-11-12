// A host never runs this remote's `polyfills`, so the exposed entry installs
// Temporal itself (only where the browser lacks it, e.g. Safari/iOS).
import 'temporal-polyfill/global';
import type { Routes } from '@angular/router';

import { provideNeocoreLocale } from '../../shared/locale/neocore-locale';

/**
 * Exposed to the host as `./TemplateRoutes` (federation.config.mjs). The host
 * mounts it with loadChildren under the manifest `path` (typeRemote 'module').
 *
 * No HttpClient is provided here on purpose: when hosted, requests use the
 * host's HttpClient and its interceptors (auth, error handler, loader), the
 * same as frontcore. app.config.ts provides one only for standalone dev.
 *
 * The locale is provided here for the same reason: the host runs no remote
 * config, so the exposed route is the only place where LOCALE_ID and the
 * default currency can be set for a hosted remote.
 */
export const TemplateRoutes: Routes = [
  {
    children: [
      {
        loadComponent: () =>
          import('./pages/template-list/template-list.page').then(
            (m) => m.TemplateListPage,
          ),
        path: '',
        title: 'Template',
      },
    ],
    path: '',
    providers: [provideNeocoreLocale()],
  },
];
