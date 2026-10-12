# syntax=docker/dockerfile:1

# DIST_STAGE selects where dist/ comes from:
#   build    (default) -> local self-contained build inside the image
#   prebuilt (CI)      -> reuses the dist/ produced by the `build_app` job
# Global ARG (before any FROM) so it can be used in `FROM ${DIST_STAGE}`.
ARG DIST_STAGE=build

# ==========================================================================
# 1) DEPS — local/standalone builds only (CI installs in `install_deps`).
#    Private @neocore packages: pass a .npmrc as a BuildKit secret, e.g.
#    docker build --secret id=npmrc,src=.npmrc .   (never COPY it).
# ==========================================================================
FROM oven/bun:1.4.2-slim AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
# --ignore-scripts: `prepare` bootstraps a developer .env, useless in an image.
RUN --mount=type=secret,id=npmrc,target=/app/.npmrc \
    bun install --frozen-lockfile --ignore-scripts

# ==========================================================================
# 2) BUILD — local/standalone builds only (CI builds in `build_app`).
#    `bun run build` runs load-env.js, which bakes .env (or .env.example when
#    .env is absent) into src/environments/environment.ts.
# ==========================================================================
FROM deps AS build
WORKDIR /app
COPY . .
RUN bun run build

# Alternative dist source: artifact built by the pipeline (CI route).
FROM scratch AS prebuilt
COPY dist /app/dist

# Indirection: Docker does not support `COPY --from=${ARG}`.
FROM ${DIST_STAGE} AS dist_src

# ==========================================================================
# 3) RUNTIME — nginx, non-root. The only stage CI builds (--target runtime).
# ==========================================================================
FROM nginx:1.31.1-alpine-slim AS runtime

ARG VERSION=0.1.0
LABEL maintainer="Neocore Team"
LABEL description="Neocore micro-frontend served by nginx"
LABEL version="${VERSION}"

ENV PORT=80

# setcap grants nginx only CAP_NET_BIND_SERVICE so it can bind :80 as a
# non-root user. libcap is needed at build time only (.cap-tools is removed).
# If the orchestrator drops all capabilities, re-add NET_BIND_SERVICE.
# The base `user` directive is removed: it is ignored when running non-root.
RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache tini ca-certificates tzdata && \
    apk add --no-cache --virtual .cap-tools libcap && \
    setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx && \
    apk del .cap-tools && \
    sed -i '/^user /d' /etc/nginx/nginx.conf && \
    rm -rf /var/cache/apk/*

# Native Federation (@angular/build:application) outputs under dist/browser.
# Served files stay owned by root and read-only (SonarQube docker:S6504).
COPY --from=dist_src /app/dist/browser /usr/share/nginx/html
COPY --chmod=0444 nginx.conf /etc/nginx/conf.d/default.conf

RUN chmod -R a=rX /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx && \
    mkdir -p /var/run/nginx && \
    chown -R nginx:nginx /var/run/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT}/health" || exit 1

# tini as PID 1 (signal handling and zombie reaping) -> nginx.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["nginx", "-g", "daemon off;"]
