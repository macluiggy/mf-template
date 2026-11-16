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
import localeEs from '../../../node_modules/@angular/common/locales/es';

/** A locale preset: the id, the default currency and the Angular locale data. */
export interface AppLocalePreset {
  /** Value provided to `DEFAULT_CURRENCY_CODE` (e.g. 'USD'). */
  currency: string;
  /** Angular locale data to register (default export of a `@angular/common/locales/*` module). */
  data?: unknown;
  /** Value provided to `LOCALE_ID` (e.g. 'es-EC'). */
  id: string;
}

/** Options of `provideAppLocale()`: any field of a preset, overridden. */
export type AppLocaleOptions = Partial<AppLocalePreset>;

/**
 * Spanish (Ecuador) preset: `es-EC` + `USD` + Angular's 'es' locale data.
 *
 * It is the default of `provideAppLocale()`, so an app that does not ask for
 * another locale formats dates, numbers and currency in Spanish (Ecuador)
 * with the US dollar.
 */
export const ES_EC_LOCALE: AppLocalePreset = {
  currency: 'USD',
  data: localeEs,
  id: 'es-EC',
};

/** Locale data already registered: registering the same data twice is a no-op. */
const registeredData = new Set<unknown>();

/** Merges the options over the default preset (an explicit `data: undefined` clears it). */
function resolvePreset(options: AppLocaleOptions): AppLocalePreset {
  return { ...ES_EC_LOCALE, ...options };
}

/** Registers the locale data of a preset, once per data object. */
function registerPresetData(preset: AppLocalePreset): void {
  const { data } = preset;
  if (data === undefined || registeredData.has(data)) {
    return;
  }
  registerLocaleData(data);
  registeredData.add(data);
}

/**
 * Registers the Angular locale data of a preset, so the pipes format in that
 * language.
 *
 * The `ES_EC_LOCALE` preset registers the parent locale 'es': Angular resolves
 * 'es-EC' to it through its parent-locale fallback (an unregistered subtag
 * falls back to 'es', and to 'en-US' only when neither is registered), so one
 * file covers every Spanish country variant.
 *
 * Idempotent: safe to call from every entry point (app.config.ts and the
 * providers of the exposed routes) without double-registering the data.
 */
export function registerAppLocale(options: AppLocaleOptions = {}): void {
  registerPresetData(resolvePreset(options));
}

/**
 * Provides the locale id and the default currency of a preset to the pipes
 * and formatters of this app, and registers its locale data.
 *
 * Defaults to the `ES_EC_LOCALE` preset (es-EC + USD).
 *
 * Register it in BOTH places:
 *   - `app.config.ts`, for standalone development (`bun run start`);
 *   - the `providers` of the root route of every exposed `Routes` array, so
 *     the locale also applies when the host mounts the remote (the host never
 *     runs this app's `app.config.ts`).
 */
export function provideAppLocale(
  options: AppLocaleOptions = {},
): EnvironmentProviders {
  const preset = resolvePreset(options);
  registerPresetData(preset);
  return makeEnvironmentProviders([
    { provide: LOCALE_ID, useValue: preset.id },
    { provide: DEFAULT_CURRENCY_CODE, useValue: preset.currency },
  ]);
}

/**
 * @deprecated Use `provideAppLocale()`: same providers, same defaults
 * (es-EC + USD). Kept so the forks that call it do not break.
 */
export function provideNeocoreLocale(): EnvironmentProviders {
  return provideAppLocale();
}

/**
 * @deprecated Use `registerAppLocale()`: same registration, same defaults
 * (es-EC + USD). Kept so the forks that call it do not break.
 */
export function registerNeocoreLocale(): void {
  registerAppLocale();
}
