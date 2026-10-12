# Environment

Angular has no runtime env: values are baked at build time by `load-env.js` into
`src/environments/environment.ts` (+ `environment.interface.ts`). Both files are **generated and
gitignored**; `start`, `build`, `watch` and `test` regenerate them first, so a fresh clone builds
with no manual step.

## Sources and precedence

1. Variables already set in the process (CI job variables, `SECRET_KEY=... bun run build`).
2. `.env` (created from `.env.example` by `bun install` via `scripts/prepare-env.js`; never
   overwritten — new defaults go to `.env.ignore` for diffing).
3. `.env.example`, only when `.env` does not exist (prints a warning).
4. Optional remote config: `GET ${API_URL}/ms-core/parameter/env` (`data` object). Extra keys are
   added as optional properties. Best-effort: on failure/timeout the build continues with the
   values above and prints a warning. `SKIP_ENV_FETCH=1` skips it (tests do).

## Variables

| Variable | Required | Notes |
|---|---|---|
| `API_URL` | yes | Gateway base URL, validated as URL → `environment.apiUrl` |
| `SECRET_KEY` | yes | ≥ 10 chars, **identical to the host** → `environment.secretKey` |
| `ENTITY_ROOT` | yes | Root entity code → `environment.entityRoot` |
| `NODE_ENV` | no | `DEV` (default) or `PROD` → `environment.production` |
| `SKIP_ENV_FETCH` | no | `1` skips the remote config call |
| `ENV_FETCH_TIMEOUT_MS` | no | Remote call timeout, default 5000 |

## Why SECRET_KEY must match the host

The host stores the access token with `encrypt-storage` (`EncryptStorageNoble`): the key **name** is
`hash('ACCESS_TOKEN')` and the value is AES-GCM encrypted, both derived from `SECRET_KEY`. The remote
reads it with the same `StorageEnum` names. With a different secret the hashed names never match, so
reads return `undefined` with no error, and requests go out without `Authorization`.

## Adding a variable

1. Add it to `.env.example` (documented) and to the CI `build_app` `.env` heredoc.
2. Add it to `readBaseConfig()` in `load-env.js` and to the generated interface.
3. Never put secrets other than `SECRET_KEY` in the bundle: everything in `environment.ts` is public.
