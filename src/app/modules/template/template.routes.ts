import type { Routes } from '@angular/router';

/**
 * Exposed to the host as `./TemplateRoutes` (federation.config.mjs). The host
 * mounts it with loadChildren under the manifest `path` (typeRemote 'module').
 *
 * No HttpClient is provided here on purpose: when hosted, requests use the
 * host's HttpClient and its interceptors (auth, error handler, loader), the
 * same as frontcore. app.config.ts provides one only for standalone dev.
 */
export const TemplateRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        title: 'Template',
        loadComponent: () =>
          import('./pages/template-list/template-list.page').then((m) => m.TemplateListPage),
      },
    ],
  },
];
