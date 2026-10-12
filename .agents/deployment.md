# Deployment

## Docker

`Dockerfile` has three routes selected by `DIST_STAGE`:

| `DIST_STAGE` | Used by | What happens |
|---|---|---|
| `build` (default) | local / `compose.yml` | `bun install` + `bun run build` inside the image (uses `.env`, or `.env.example`) |
| `prebuilt` | CI `build_image` | copies `dist/` produced by `build_app` |

Runtime: `nginx:alpine-slim`, non-root (`USER nginx` + `CAP_NET_BIND_SERVICE`), `tini` as PID 1,
read-only served files, `HEALTHCHECK` on `/health`. Private `@neocore` packages in a local build:
`docker build --secret id=npmrc,src=.npmrc .` (never `COPY` the `.npmrc`).

## nginx

`nginx.conf` serves `dist/browser` with CORS (`Access-Control-Allow-Origin: *`, required because the
host fetches `remoteEntry.json` and chunks cross-origin), `no-store` caching (a deploy must be
visible immediately), SPA fallback to `index.html`, `OPTIONS` → 204, and `/health`.
The MF is served at the root of its own origin; do not add path prefixes (`/fvc`-style locations)
unless the reverse proxy requires it.

## CI/CD (`.gitlab-ci.yml`)

`install → test (lint + unit) → security (SAST, secret detection + gates) → build → docker → deploy`,
on `main`, `development`, `quality`, `pre-production`.

- Per-repo values are in the top `variables:` block (`SERVICE_NAME`, `CONTAINER_NAME`,
  `COMPOSE_IMAGE_VAR`, `COMPOSE_FILE_*`, `RUNNER_TAG`); a fork edits only that block.
- Environment-scoped CI/CD variables: `API_URL`, `SECRET_KEY`, `ENTITY_ROOT`, `NODE_ENV`,
  `DEPLOY_HOST_DEV|QA|PREPROD`, `DEPLOY_SSH_PRIVATE_KEY`.
- `.npmrc` for `@neocore/*` is generated with `CI_JOB_TOKEN`; the project must be in the job-token
  allowlist of `neocore/core/libcomponents`.
- Image tags: `<version>-<env>-<sha>` and the channel tag (`stable`, `dev`, `qa`, `pre-prod`).
- Deploy: SSH to the server, export `COMPOSE_IMAGE_VAR=<exact image>`, `docker compose pull/up` the
  service from the compose file that lives on the server.
- `.env` is written in `build_app` from CI variables and is never printed nor kept as an artifact.

## Adding `@neocore/lib-components`

It is published in the private GitLab registry (project 140), so it is not a default dependency.

1. Local: create an untracked `.npmrc`:
   ```ini
   @neocore:registry=https://gitads.aseguradoradelsur.com/api/v4/projects/140/packages/npm/
   //gitads.aseguradoradelsur.com/api/v4/projects/140/packages/npm/:_authToken=<personal token>
   ```
2. `bun add @neocore/lib-components@<version>` (already exempted from `minimumReleaseAge` in `bunfig.toml`).
3. In `federation.config.mjs` share it loosely, as frontcore does:
   `'@neocore/lib-components': { singleton: false, strictVersion: false, requiredVersion: false }`.
4. CI already writes the `.npmrc` (`.npmrc_setup`).
