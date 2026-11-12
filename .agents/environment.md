# Environment

Angular has no runtime env: values are baked at build time by `load-env.js` into
`src/environments/environment.ts` (+ `environment.interface.ts`). Both files are **generated and
gitignored**; `start`, `build`, `watch` and `test` regenerate them first, so a fresh clone builds
with no manual step.

Only `API_URL` is required: the template is a plain Angular app. Everything NEOCORE-shaped
(`SECRET_KEY`, `ENTITY_ROOT`, the remote config call) is opt-in.

## Sources and precedence

1. Variables already set in the process (CI job variables, `SECRET_KEY=... bun run build`).
2. `.env` (created from `.env.example` by `bun install` via `prepare.js` → `scripts/prepare-env.js`; never
   overwritten — new defaults go to `.env.ignore` for diffing).
3. `.env.example`, only when `.env` does not exist (prints a warning).
4. Optional remote config: `GET $ENV_REMOTE_URL` — **opt-in**, the call only happens when
   `ENV_REMOTE_URL` is set (NEOCORE: `${API_URL}/ms-core/parameter/env`). Extra keys are added as
   optional properties; the base keys (`production`, `apiUrl`, `secretKey`, `entityRoot`) are never
   overwritten. Best-effort: on failure/timeout the build continues with the values above and prints
   a warning. `SKIP_ENV_FETCH=1` is a hard off switch, even when `ENV_REMOTE_URL` is set (tests do).
   Tests also run `load-env.js --example`: they read only `.env.example`, so a missing or
   personalized `.env` never breaks `bun run test` (process/CI variables still win).

An empty value counts as unset: CI writes `KEY=` when a variable is not configured.

## Variables

| Variable               | Required | Notes                                                           |
| ---------------------- | -------- | --------------------------------------------------------------- |
| `API_URL`              | yes      | Gateway base URL, validated as URL → `environment.apiUrl`       |
| `SECRET_KEY`           | only with `provideNeocoreHost()` | ≥ 10 chars, **identical to the host** → `environment.secretKey` (optional property) |
| `ENTITY_ROOT`          | no       | Root entity code → `environment.entityRoot` (optional property)  |
| `NODE_ENV`             | no       | `DEV` (default) or `PROD` → `environment.production`            |
| `ENV_REMOTE_URL`       | no       | Full URL of the remote env document; the fetch only runs when it is set |
| `SKIP_ENV_FETCH`       | no       | `1` skips the remote config call                                |
| `ENV_FETCH_TIMEOUT_MS` | no       | Remote call timeout, default 5000                               |

## The NEOCORE preset

`SECRET_KEY` and `ENTITY_ROOT` are read only by the NEOCORE integration
(`src/app/integrations/neocore/`, wired by `provideNeocoreHost()`). Without it the template is a
plain app: no secret, no entity root, no remote config call. The generated interface declares
`secretKey` and `entityRoot` as optional properties, so the type is the same with or without the
preset; the values are written only when the variables are set.

## Why SECRET_KEY must match the host (only with `provideNeocoreHost()`)

The host stores the access token with `encrypt-storage` (`EncryptStorageNoble`): the key **name** is
`hash('ACCESS_TOKEN')` and the value is AES-GCM encrypted, both derived from `SECRET_KEY`. The remote
reads it with the same `StorageEnum` names
(`src/app/integrations/neocore/storage/storage.service.ts`). With a different secret the hashed names
never match, so
reads return `undefined` with no error, and requests go out without `Authorization`.

Without `SECRET_KEY` the storage adapter throws on its **first use** (never at import time): the
value is checked when the encrypted client is created.

## Adding a variable

1. Add it to `.env.example` (documented) and to the CI `build_app` `.env` heredoc.
2. Add it to `readBaseConfig()` in `load-env.js` and to the generated interface.
3. Never put secrets other than `SECRET_KEY` in the bundle: everything in `environment.ts` is public.
