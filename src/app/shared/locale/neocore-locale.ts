import { registerLocaleData } from '@angular/common';
import {
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';

// Relative path on purpose: the bare specifier '@angular/common/locales/es'
// is an external of the shared @angular/common package, so Native Federation
// leaves it to the import map. Sharing the locale files (`resolveGlob: true`)
// scopes the whole @angular/common package, @angular/common/http included, to
// this remote and cuts it off from the host's HttpClient and interceptors
// (see federation.config.mjs). The locale file is self-contained data, so it
// is bundled into this remote instead. Same approach as frontbills and
// frontvirtualofficebroker.
import localeEs from '../../../../node_modules/@angular/common/locales/es';

/** Locale of every Neocore front: Spanish (Ecuador). */
export const NEOCORE_LOCALE_ID = 'es-EC';

/** Currency of every Neocore front: US dollar. */
export const NEOCORE_CURRENCY_CODE = 'USD';

let registered = false;

/**
 * Registers Angular's 'es' locale data exactly once.
 *
 * The data is the parent locale 'es': Angular resolves 'es-EC' to it through
 * its parent-locale fallback (an unregistered subtag falls back to 'es',
 * and to 'en-US' only when neither is registered), so one file covers every
 * Spanish country variant.
 *
 * Idempotent via the module-level guard: safe to call from every entry point
 * (app.config.ts and the providers of the exposed routes) without
 * double-registering the data.
 */
export function registerNeocoreLocale(): void {
  if (registered) {
    return;
  }
  registerLocaleData(localeEs);
  registered = true;
}

/**
 * Provides the Neocore locale (es-EC) and its default currency (USD) to the
 * pipes and formatters of this app.
 *
 * Register it in BOTH places:
 *   - `app.config.ts`, for standalone development (`bun run start`);
 *   - the `providers` of the root route of every exposed `Routes` array, so
 *     the locale also applies when the host mounts the remote (the host never
 *     runs this app's `app.config.ts`).
 */
export function provideNeocoreLocale(): EnvironmentProviders {
  registerNeocoreLocale();
  return makeEnvironmentProviders([
    { provide: LOCALE_ID, useValue: NEOCORE_LOCALE_ID },
    { provide: DEFAULT_CURRENCY_CODE, useValue: NEOCORE_CURRENCY_CODE },
  ]);
}
