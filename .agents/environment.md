# Environment

Angular has no runtime env: values are baked at build time by `load-env.js` into
`src/environments/environment.ts` (+ `environment.interface.ts`). Both files are **generated and
gitignored**; `start`, `build`, `watch` and `test` regenerate them first, so a fresh clone builds
with no manual step. Everything in `environment.ts` ships in the public bundle.

## Sources and precedence

1. Variables already set in the process (CI job variables, `API_URL=... bun run build`).
2. `.env` (created from `.env.example` by `bun install` via `scripts/prepare-env.js`; never
   overwritten — new defaults go to `.env.ignore` for diffing).
3. `.env.example`, only when `.env` does not exist (prints a warning).

## Variables

| Variable | Required | Notes |
|---|---|---|
| `API_URL` | yes | Backend base URL, validated as URL → `environment.apiUrl` |
| `SECRET_KEY` | yes, while storage encryption is used | ≥ 10 chars → `environment.secretKey` |
| `NODE_ENV` | no | `DEV` (default) or `PROD` → `environment.production` |

## SECRET_KEY

`StorageService` uses `encrypt-storage` (`EncryptStorageNoble`): the key **name** is
`hash('ACCESS_TOKEN')` and the value is AES-GCM encrypted, both derived from `SECRET_KEY`.

- It is obfuscation of localStorage, not a security boundary: the key ships in the bundle.
- Changing it makes previously stored values unreadable (reads return `undefined`), so users are
  effectively logged out after a deploy that changes it.
- If you drop encryption (plain `localStorage`), remove `SECRET_KEY` from `REQUIRED_VARS` and the
  generated interface in `load-env.js`, and from `.env.example`.

## Adding a variable

1. Add it to `.env.example` (documented) and to the CI `build` job `.env` heredoc.
2. Add it to `readConfig()` and to the generated interface in `load-env.js`.
3. Never put server-side secrets in the bundle.
