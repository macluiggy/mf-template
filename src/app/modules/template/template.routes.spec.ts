import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Route } from '@angular/router';

import { TemplateRoutes } from './template.routes';

describe('TemplateRoutes', () => {
  it('provides the locale in the exposed route, because the host runs no remote config', () => {
    const root = TemplateRoutes[0] as Route;

    expect(root.providers).toBeDefined();

    TestBed.configureTestingModule({ providers: root.providers });

    expect(TestBed.inject(LOCALE_ID)).toBe('es-EC');
  });
});
