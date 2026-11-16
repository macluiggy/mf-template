// Loaded by @angular/build:unit-test through the `runnerConfig` option in angular.json.
// No import/export statements on purpose: package.json has no "type": "module", so Vite
// loads this file as CommonJS and warns on any ESM statement, even `import type`.
// The inline `import()` type below is not a statement: it only types the object with
// the same `ViteUserConfig` that `defineConfig()` accepts (autocompletion and checks).
const config: import('vitest/config').ViteUserConfig = {
  test: {
    server: {
      deps: {
        // A fork that adds an ESM dependency importing extensionless paths
        // (e.g. `dayjs/locale/es`) must inline it here: Node's strict ESM
        // loader rejects those, so let Vite transform them.
        // inline: ['<the-package>'],
        inline: [],
      },
    },
  },
};

module.exports = config;
