import type { Routes } from '@angular/router';
import { provideMfHttpClient } from '../../shared/providers/http.providers';

/**
 * Exposed to the host as `./TemplateRoutes` (federation.config.mjs). The host
 * mounts it with loadChildren under the manifest `path` (typeRemote 'module').
 *
 * The root route carries the MF providers (HttpClient + interceptors) because
 * the host never runs this app's app.config.ts.
 */
export const TemplateRoutes: Routes = [
  {
    path: '',
    providers: [provideMfHttpClient()],
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
