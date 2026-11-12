# Karma/Jasmine fork → Vitest

The template's `test` script runs Vitest through `@angular/build:unit-test`. A fork still on
Karma/Jasmine aligns to it as part of the script alignment, following
<https://angular.dev/guide/testing/migrating-to-vitest> (Karma still works in Angular 22; Vitest is
the default for new projects and the template's runner). Learned migrating `frontcore`
(NgModule business code, zone.js, `fakeAsync` specs, `@neocore/lib-components`).

## Steps

1. **Dependencies.** Remove `karma`, `karma-*`, `jasmine-core`, `@types/jasmine` and
   `@angular-devkit/build-angular` (when only the karma target used it). Add the template's exact
   `vitest` and `jsdom` versions. Keep `@angular/build`.
2. **`angular.json`.** Copy the template's `build-test` target and `test` target
   (`@angular/build:unit-test`, `buildTarget: <project>:build-test:development`,
   `tsConfig: tsconfig.spec.json`, `runnerConfig: vitest.config.ts`). Move the karma target's
   `styles`/`allowedCommonJsDependencies` into `build-test`. For a fork that is NOT zoneless:
   - `polyfills: ["zone.js", "@angular/localize/init"(if used), "zone.js/testing", "zone.js/plugins/vitest-patch"]`
     — the patch keeps `fakeAsync`/`tick`/`flush`/`waitForAsync` working.
   - `"aot": false` on `build-test` when specs declare NgModule components in
     `TestBed.declarations`: AOT compiles them outside their NgModule (`NG8002 Can't bind to
     'formGroup'/'ngClass'`, `NG8001 not a known element`).
3. **tsconfig.** `vitest/globals` instead of `jasmine` in `tsconfig.json` (the editor and
   `bun check` read the root one) and `tsconfig.spec.json`. Exclude folders whose runner is not
   installed (e.g. `e2e/` with Playwright) from the root config.
4. **`vitest.config.ts`.** The template ships one; keep `server.deps.inline` for
   `@neocore/lib-components` — it imports `dayjs/locale/es` without an extension and Node's ESM
   loader rejects it (`Cannot find module .../dayjs/locale/es`), failing every spec that touches
   the library.
5. **Specs.** `ng g @schematics/angular:refactor-jasmine-vitest`, delete its
   `jasmine-vitest-*.md` report, then fix what it leaves (type-check fast with
   `bunx tsc -p tsconfig.spec.json --noEmit`, it lists file:line):

| Leftover                                                              | Fix                                                                         |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `TS2322 { m: Mock } is not assignable to MockedObject<T>` (partial mock from `createSpyObj`) | `{ ... } as unknown as MockedObject<T>`, or type the variable with only the mocked members |
| `TS2345 undefined → boolean` on `vi.spyOn(Pubsub, 'publish').mockReturnValue(undefined)` | `mockReturnValue(true)` (`publish` returns `boolean`)                        |
| `TS2532` on `mock.lastCall[0]`                                        | `mock.lastCall![0]`                                                          |
| `expect(arr).toContain(expect.objectContaining(...))` fails           | `expect(arr).toEqual(expect.arrayContaining([expect.objectContaining(...)]))` — Vitest `toContain` uses `===` |
| Layout asserts (`scrollHeight`, `clientHeight`, `getBoundingClientRect`) are always 0 | jsdom has no layout: assert the CSS that causes it, or move the spec to browser mode (`*.browser.spec.ts`, Playwright) |
| Template specs render nothing (`expected 0 to be 2` rows)             | They are zoneless; with zone.js loaded TestBed switches to zone CD. The template's `template-table` spec provides `provideZonelessChangeDetection()` for this; do the same in any zoneless spec relying on auto change detection |

6. **Gate.** `bun run test` (all files green), `bun check`, production build,
   `bun install`. Never delete or `skip` a test to get green; a failure caused by
   source code is reported, not hidden.
