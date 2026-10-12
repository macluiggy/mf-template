import type { Routes } from '@angular/router';

// Each feature module is lazy-loaded under its own path prefix.
export const routes: Routes = [
  {
    path: 'template',
    loadChildren: () => import('./modules/template/template.routes').then((m) => m.TemplateRoutes),
  },
  { path: '', pathMatch: 'full', redirectTo: 'template' },
];
