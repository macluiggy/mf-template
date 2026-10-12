import type { Routes } from '@angular/router';

/**
 * Feature entry, lazy-loaded from `app.routes.ts` with loadChildren.
 * HttpClient and interceptors come from `app.config.ts` (provideAppHttpClient).
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
