import {
  shareAll,
  withNativeFederation,
} from '@angular-architects/native-federation/config';

// Remote policy, aligned with the host that loads it:
// the whole Angular/rxjs stack is a strict singleton. The host shares the same
// packages with the same versions (see package.json pins), so a version drift
// fails loudly at load time instead of running two Angular runtimes.
// `includeSecondaries: true` registers secondary entry points (for example
// `@angular/common/http`); shareAll() only registers the root export otherwise.
const strict = {
  requiredVersion: 'auto',
  singleton: true,
  strictVersion: true,
};
const strictSecondary = { ...strict, includeSecondaries: true };

export default withNativeFederation({
  // Contract with the host: the key `./X` MUST equal the exported symbol `X`.
  // The host resolves `m[entry.exposedModule]` after loadRemoteModule() and,
  // with typeRemote 'module', mounts it through loadChildren.
  // `bun run generate:module -- --name=<name> --expose` appends entries here.
  exposes: {
    './TemplateRoutes': './src/app/modules/template/template.routes.ts',
  },

  features: {
    // Opt-in: groups chunks in remoteEntry.json for a smaller metadata file.
    denseChunking: true,
  },

  // Must be unique across every remote registered in the host manifest.
  name: 'mf-template',

  shared: {
    ...shareAll(strict, {
      overrides: {
        '@angular/common': strictSecondary,
        '@angular/platform-browser': strictSecondary,
        rxjs: strictSecondary,
      },
    }),
  },

  // tsconfig `paths` (e.g. `src/*`, `@src/*`) are import aliases of THIS app,
  // not libraries. Without an explicit list, Native Federation shares every
  // path mapping and compiles those folders as a separate "mapping-bundle",
  // outside their NgModules/components (NG8002 on bindings of imported
  // directives). List a mapping here only for a real shared library.
  sharedMappings: [],

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // CommonJS/UMD packages: Native Federation's esbuild-based shared-export
    // analysis cannot read their module shape and falls back to a default-only
    // export, which breaks named imports at runtime (for example
    // "does not provide an export named 'EncryptStorage'"). They are bundled
    // locally instead of shared.
    'encrypt-storage',
    'pubsub-js',
    // Polyfills are never shared: each remote bundles its own copy and
    // `install()` is a no-op once Temporal exists, so remotes pinned to
    // different polyfill versions cannot trip a strict-version check.
    'temporal-polyfill',
    'temporal-polyfill/global',
  ],
});
