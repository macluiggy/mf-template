import { shareAll, withNativeFederation } from '@angular-architects/native-federation/config';

// Remote policy, aligned with the host (frontcontainer) and frontcore:
// the whole Angular/rxjs stack is a strict singleton. The host shares the same
// packages with the same versions (see package.json pins), so a version drift
// fails loudly at load time instead of running two Angular runtimes.
// `includeSecondaries: true` registers secondary entry points (for example
// `@angular/common/http`); shareAll() only registers the root export otherwise.
const strict = {
  singleton: true,
  strictVersion: true,
  requiredVersion: 'auto',
};
const strictSecondary = { ...strict, includeSecondaries: true };

export default withNativeFederation({
  // Must be unique across every remote registered in the host manifest.
  name: 'mf-template',

  // Contract with the host: the key `./X` MUST equal the exported symbol `X`.
  // The host resolves `m[entry.exposedModule]` after loadRemoteModule() and,
  // with typeRemote 'module', mounts it through loadChildren.
  // `bun run generate:module -- --name=<name> --expose` appends entries here.
  exposes: {
    './TemplateRoutes': './src/app/modules/template/template.routes.ts',
  },

  shared: {
    ...shareAll(strict, {
      overrides: {
        '@angular/common': strictSecondary,
        '@angular/platform-browser': strictSecondary,
        rxjs: strictSecondary,
      },
    }),
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // CommonJS/UMD packages: Native Federation's esbuild-based shared-export
    // analysis cannot read their module shape and falls back to a default-only
    // export, which breaks named imports at runtime (for example
    // "does not provide an export named 'EncryptStorage'"). Same finding as the
    // host and frontcore; they are bundled locally instead of shared.
    'encrypt-storage',
    'pubsub-js',
  ],

  features: {
    // Opt-in: groups chunks in remoteEntry.json for a smaller metadata file.
    denseChunking: true,
  },
});
