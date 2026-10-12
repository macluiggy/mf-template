# Deployment

## Docker

`Dockerfile` has two routes selected by `DIST_STAGE`:

| `DIST_STAGE` | Used by | What happens |
|---|---|---|
| `build` (default) | local / `compose.yml` | `bun install` + `bun run build` inside the image (uses `.env`, or `.env.example`) |
| `prebuilt` | CI `docker` job | copies `dist/` produced by the `build` job |

Runtime: `nginx:alpine-slim`, non-root (`USER nginx` + `CAP_NET_BIND_SERVICE`), `tini` as PID 1,
read-only served files, `HEALTHCHECK` on `/health`.

```bash
docker compose up -d --build     # http://localhost:${WEB_PORT:-8080}
```

## nginx

`nginx.conf` serves `dist/browser` as a single-page application:

- unknown paths fall back to `index.html` (client-side routes);
- `index.html` is never cached (it points to the current hashed bundles);
- hashed static assets are cached for a year (`immutable`);
- `/health` answers `200 ok` for the container healthcheck.

No CORS headers are needed: the app and its assets are served from the same origin. Calls to
`API_URL` on another origin need CORS on the backend, not here.

## CI (`.gitlab-ci.yml`)

`install → lint (biome check) → test → build → docker`, on merge requests and branches.

- CI/CD variables: `API_URL`, `SECRET_KEY`, optional `NODE_ENV` (default `PROD` in CI).
- `build` writes `.env` from those variables, runs `bun run build` and keeps `dist/` as an artifact.
- `docker` (default branch only) builds the `runtime` stage with `DIST_STAGE=prebuilt` and pushes
  `$CI_REGISTRY_IMAGE:<short-sha>` and `:latest` to the project's container registry.
- There are no deploy stages: add them per project (target hosts differ per client).
