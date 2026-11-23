import {
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';

import { environment } from '../environments/environment';
import { provideNeocoreHost } from './integrations/neocore/neocore.providers';

/**
 * Preset selector of the template, chosen by name with `TEMPLATE_PRESET`
 * (`generic` by default, or `neocore`) and baked into
 * `environment.templatePreset` by `load-env.js`.
 *
 * This is the ONLY file outside `src/app/integrations/` that imports an
 * integration. Everything else (`app.config.ts`, every exposed route) calls
 * `provideTemplatePreset()`, so removing a preset means removing its entry in
 * `TEMPLATE_PRESET_PROVIDERS` and its folder under `integrations/`.
 */
export const TEMPLATE_PRESET_NAMES = ['generic', 'neocore'] as const;

export type TemplatePresetName = (typeof TEMPLATE_PRESET_NAMES)[number];

/** Preset used when `TEMPLATE_PRESET` is unset. */
export const TEMPLATE_PRESET_NAME_DEFAULT: TemplatePresetName = 'generic';

/**
 * Normalizes the baked `environment.templatePreset` to a known name. `load-env.js`
 * already rejects an unknown value, so this only matters after a preset is
 * removed from this file: the generated type still lists it until the next
 * build, and an unknown name falls back to the safe default instead of crashing.
 */
function resolveTemplatePresetName(raw: string): TemplatePresetName {
  return (TEMPLATE_PRESET_NAMES as readonly string[]).includes(raw)
    ? (raw as TemplatePresetName)
    : TEMPLATE_PRESET_NAME_DEFAULT;
}

/**
 * Providers of each preset. `generic` adds nothing: `provideAppCore()` already
 * bound the safe local defaults. `neocore` overrides those ports with the host
 * adapters, so it must be registered after `provideAppCore()`.
 */
const TEMPLATE_PRESET_PROVIDERS: Record<
  TemplatePresetName,
  () => EnvironmentProviders[]
> = {
  generic: () => [],
  neocore: () => [provideNeocoreHost()],
};

/**
 * Binds the providers of the preset selected with `TEMPLATE_PRESET`. Call it
 * after `provideAppCore()` so a preset overrides the core defaults.
 *
 * @param name Preset name; defaults to `environment.templatePreset`
 */
export function provideTemplatePreset(
  name: TemplatePresetName = resolveTemplatePresetName(
    environment.templatePreset,
  ),
): EnvironmentProviders {
  return makeEnvironmentProviders(TEMPLATE_PRESET_PROVIDERS[name]());
}
