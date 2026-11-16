# Version alignment (host ↔ fork)

Native Federation shares Angular and rxjs as `singleton + strictVersion`. The host
`frontcontainer` and every remote mounted in the same page must resolve the SAME runtime. This is
not a "nice to have": a drift gives the remote its own Angular copy, and the host throws
`NG0203` (`InjectionToken router duplicate forRoot guard`) or logs `NG0912` duplicate-component
warnings when the remote's `RouterModule`/injector is initialized.

## Source of truth

1. **The host's installed version** (`frontcontainer/package.json` + `node_modules` + `bun.lock`),
   not the template doc and not a caret range.
2. **The live `remoteEntry.json`** of both sides. The shared entry is the effective contract:

```bash
curl -s http://localhost:4200/remoteEntry.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);for(const x of j.shared.filter(v=>['@angular/core','@angular/router','rxjs'].includes(v.packageName)))console.log(x.packageName,x.version,'required='+x.requiredVersion,'strict='+x.strictVersion)})"
curl -s http://localhost:<fork-port>/remoteEntry.json | node -e "..."   # same
```

`requiredVersion` is what the remote demands; `version` is what that build provides. With
`strictVersion: true`, the host's provided version must satisfy the remote's required version.

The template's current pins (the host must match):

| Package                                                                                 | Version |
| --------------------------------------------------------------------------------------- | ------- |
| `@angular/*` (core, common, compiler, forms, platform-browser, router, animations, cdk) | 22.2.1  |
| `@angular/build`, `@angular/cli`, `@angular/compiler-cli`, `@angular/localize`          | 22.2.1  |
| `@angular-architects/native-federation`                                                 | 22.2.2  |
| `typescript`                                                                            | ~6.0.3  |
| `rxjs`                                                                                  | ~7.8.2  |
| `zone.js`                                                                               | 0.16.x  |

Exact pins (`22.2.1`, never `^22.2.1`/`~22.2.1`) on `@angular/*`, `@angular/build`, `@angular/cli`,
`@angular-architects/native-federation`. The Angular packages declare exact peer dependencies on
each other; a mixed patch level inside one app is not supported either.

## Why a fresh install can silently change the runtime

`package.json`, `bun.lock` and `node_modules` can disagree after someone upgraded a fork by hand.
The incident that motivated this skill: the host had `package.json`/`bun.lock` on 22.1.7 but
`node_modules` on 22.2.1 (a previous manual upgrade). The broker on 22.1.7 broke with NG0203; a
fresh `bun i` on the host downgraded it to 22.1.7 and fixed the broker, but then the template on
22.2.1 was the odd one out. **Always check all three**:

```bash
node -e "console.log(require('./package.json').dependencies['@angular/core'])"
node -e "console.log(require('./node_modules/@angular/core/package.json').version)"
grep -o '"@angular/core@[0-9.]*"' bun.lock | sort -u
```

If they disagree, fix the declaration (`package.json`), run `bun install`, and verify the installed
version. Never rely on `node_modules` diverging from the manifest; CI runs a plain `bun install`
from `package.json` (no lockfile is versioned) and will reproduce the declared version and break
the runtime.

## Aligning a fork

1. Read the host's effective version (live `remoteEntry.json` or the host repo).
2. Set the exact same `@angular/*`, `@angular/build`, `@angular/cli`, `@angular/compiler-cli`,
   `@angular/localize` and Native Federation versions in the fork's `package.json`.
3. Keep the fork's extra Angular-compatible deps (`@angular/cdk`, `@ng-bootstrap/ng-bootstrap`,
   `ngx-*`) on their compatible majors; their peers usually allow `^22.0.0`.
4. `bun install`; confirm the lock pin; **restart the dev server** (Angular/NF are loaded by the
   running process; a source save is not enough).
5. Re-check the live `remoteEntry.json` on both sides and load an exposed route in the host.

## NG0203 / NG0912 diagnosis

- **NG0203** with a stack through `RouterModule_Factory` → `inject()` → `initRemoteEntry` is the
  strict-singleton mismatch. Align the runtime, reinstall, restart, hard-reload the host.
- **NG0912 "Component ID generation collision"** means two copies of the same library's components
  are registered in one Angular runtime. It is common when both host and fork bundle
  `@ng-bootstrap/ng-bootstrap`, `@angular/cdk`, `ngx-otp-input`, etc. Usually warnings only; they
  are not the cause of a blank page. Do not "fix" them by rewriting business code; share the
  library only if the federation policy allows it.
- A remote that loads but renders nothing can also be a route-shape issue (e.g. a child route that
  requires `:id`, or a bare parent path). Check the router config before blaming versions.

## `dist/browser` caveat

`ng serve` (NF dev server) and a production `bun run build:federation` write the SAME `dist/browser` directory.
Running the production build while the dev server is up replaces `remoteEntry.json` with the
production one (hashed expose names, no build-notifications endpoint) and can make the host load a
stale/incompatible manifest. Symptoms: the remote no longer hot-swaps, `outFileName` changes, or the
SSE endpoint disappears. Fix: save any source file to let the dev server regenerate its artifacts,
or restart `ng serve`. Prefer running the production build with the dev server stopped.

## Shell environment gotcha

Some terminals export `NODE_ENV=production`. `load-env.js` accepts only `DEV` or `PROD` and fails
with `Environment variable 'NODE_ENV' must be one of [DEV, PROD]`. Run the gate explicitly:

```bash
NODE_ENV=DEV SKIP_ENV_FETCH=1 bun run test
NODE_ENV=PROD SKIP_ENV_FETCH=1 bun run build:federation
```
