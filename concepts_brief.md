# Ready-to-use front-template (standardized micro-frontend base)

> **Historical document — not template guidance.** This is the 2026-11-07 design brief that
> produced this template inside the NEOCORE fleet (it talks about `core/frontcontainer`,
> `ms-core` and the other fronts). It is kept for context only: the template's own rules live in
> [`AGENTS.md`](AGENTS.md) and [`.agents/`](.agents/).

* **Author:** Luiggy Macías
* **Date:** 2026-11-07

## Overview

`core/front-template` (Angular 22.2 + Native Federation 22.2) should become the single base for new
micro-frontends, standardized on the patterns every existing front already repeats: `x-api-key:
resource:action` permissions, encrypted session storage written by the host, pubsub toasts/loader,
typed service responses, `load-env.js`, Bootstrap + ng-bootstrap, nginx Docker image and the shared CI.

All seven review lenses agreed: the feature list is mostly right, but **where the code lives is wrong**.
Most of the proposed common layer (interceptors, opt-out tokens, storage keys, permission check, guard)
is *host contract* code. Copying it into a copy-paste template recreates the drift the effort is meant
to remove. That drift is already visible: `core/mf-template` duplicates front-template file by file,
`StorageEnum` exists in about 10 copies, and the template's `StorageService` lost frontcore's
SECRET_KEY-mismatch detection.

**Evidence limit:** the local `core/frontcontainer` checkout is on `quality` (Angular 17.3, webpack
Module Federation, encrypt-storage ~2.16.6). The Angular 22 host on `development` was not inspected, so
every statement about it is unverified.

## Analysis

### Verified facts that change the concept

1. **HttpClient ownership contradicts itself.** `src/app/shared/providers/http.providers.ts:9-13` says
   to register it in "BOTH places" (including exposed routes), while `template.routes.ts:10-12`,
   `.agents/host-integration.md:66-72` and `AGENTS.md:22-23` say never in exposed routes. The stale
   comment already spread to `frontvirtualofficebroker`, whose `federated-headers.util.ts:11-15` notes
   that the host's interceptors never reach the remote.
2. **Opt-out tokens cannot cross the remote/host boundary.** `HttpContextToken` matches by object
   identity; a token created in the remote bundle is invisible to host interceptors. There are four
   variants today: `SKIP_LOADING` (frontcore), `SKIP_LOADER` and `SKIP_ERROR_TOAST` (vbroker,
   migrationov, zohoadmin), and the host's `SUPPRESS_ERROR_TOAST`, whose value is a predicate, not a
   boolean. The host loader has no opt-out. Moving tokens into lib-components does not fix it while
   frontcore shares that library with `singleton: false` (`frontcore/federation.config.mjs:59-63`).
3. **encrypt-storage v2 (host) vs v3 `EncryptStorageNoble` (template) compatibility is unproven.** The
   comment "same engine as host" (`storage.service.ts:8-11`) is false against `quality`. A mismatch
   makes reads return `undefined` silently and requests go out without a Bearer token.
4. **The storage key list was wrong.** The host writes USER_SESSION, METADATA, TYPE_ID, NAVIGATION,
   PERMISSION, ROLE_PERMISSION and ACCESS_TOKEN (`session-store.service.ts:58-81`). BROKER, CHANNEL and
   MULTI_CHANNEL are written by remotes. ROLE is only read (`ROLE_ID: 'ROLE'`).
5. **Two permission algorithms exist, and no route guard exists anywhere.** frontcore, vbroker and
   migrationov check PERMISSION with allow/`denny` lists and a `resource:*` wildcard; zohoadmin checks
   ROLE_PERMISSION first, merges `menuActions` and sends `x-info-user`.
6. **Part of the layer already exists.** frontcore has functional error/loader/auth interceptors with a
   401 refresh queue (drifted: refresh URL `/ms-core/...` vs the host's
   `/ms-authentication/security/refresh-token`). `@neocore/lib-components` already ships `PaginationI`,
   `PAGE_SIZE`, `PaginationComponent`, `EmptyDataComponent` and `InfoPermissionComponent`. vbroker's
   `shared/locale/es-locale.ts` documents why registering the locale in `bootstrap.ts` gets lost from
   `remoteEntry.json`.
7. **`host-integration.md` is wrong against `quality`:** the manifest path is
   `ms-authentication/security/manifest`, the host version is 17.3.12 (not 22.2.1), `clearBreadCrumb` is in
   `breadcrumb.component.ts`, and `watchLocalRemoteRebuilds` / `frontcontainer/docs/local-development.md`
   do not exist.
8. **The anti-patterns are in the host too:** `localStorage.clear()` in its error interceptor,
   `inactivity.service` and `profile.component`, and SECRET_KEY as a literal in `environment.ts:13`.
9. **The loader can hide too early:** the host keeps `loading` as a boolean (`app.component.ts:75-77`),
   so overlapping requests hide it on the first `false`.

### Contradictions and how to resolve them

* **C1 — Every remote needs the common HTTP layer, but there is only one hosted HttpClient.** If the host
  owns HttpClient, remote interceptors only run standalone. If remotes own it, you get double toasts,
  double loaders and racing refreshes; with refresh-token rotation a race logs the user out.
  *Resolution:* the host owns hosted HTTP. The remote installs its interceptors only when no host is
  present, behind one `provideNeocoreRemote()`-style entry that detects the host via an optional
  injection.
* **C2 — One template, two incompatible hosts.** Webpack MF and Native Federation cannot load each
  other's remotes. *Resolution:* pin the template to the NF 22 host as a declared precondition, and make
  the remote fail loudly on a mismatched host instead of reading `undefined`.
* **C3 — Copy-paste template vs remotes that must keep receiving fixes.** *Resolution:* move contract
  code (keys, topics, tokens, permission check, guard, typed storage) into a versioned package (an
  extended lib-components or a thin `@neocore/mf-runtime`) shared as a strict singleton. The template
  keeps only wiring and tooling; later updates arrive by `ng update` schematics, not git merges.
* **C4 — Remotes decrypt storage vs secrets stay out of bundles.** A browser-side key is public, so the
  encryption is obfuscation. *Long-term option:* the host exposes a read-only, typed `HostContext`
  (token getter, permissions, role, navigation, metadata); remotes never hold SECRET_KEY, and logout and
  clearing become host-only. The gateway's `x-api-key` check stays the authority; the client guard only
  hides UI.

### Trade-offs

* A shared package adds a release cadence and version-skew failures at load time, and the Angular 17
  host cannot consume it.
* A `HostContext` turns the host API into a versioned contract.
* Standalone and hosted modes drift unless a contract test runs in every remote's CI.

### Ideal final result

A new remote is the template plus the shared runtime package, and contains business modules only. The
host owns HttpClient, session, refresh, logout, toasts and loader, and publishes a typed, versioned
contract. No remote contains SECRET_KEY or `localStorage.clear()`. One CI contract test proves each
remote works standalone and inside the pinned host version.

## Goals vs. Non-Goals

* **In-Scope Goals (in order):**
  * **WU0 — contract decisions (docs only, gates the rest):**
    * Settle the HttpClient rule and delete the stale comment.
    * Add a test that fails if an exposed Routes file provides HttpClient.
    * Define the opt-out mechanism: a shared token module, or a header the host strips.
    * Name the pinned host branch or commit as the contract source, and fix `host-integration.md` against it.
  * **WU1 — host runtime contract (highest risk; needs WU0 and a deployed NF 22 host):**
    * Typed storage keys copied from the host's `storage-keys.constant.ts`, with an owner per key.
    * One `hasPermission` function plus a functional `CanMatchFn` guard that reuses `buildPermissionHeaders`.
    * Standalone-only interceptors ported from frontcore.
    * A startup diagnostic for "host token not readable".
  * **WU2 — reference module and UX defaults:**
    * The guard wired into the example routes.
    * Reuse lib-components' `PaginationI` / `EmptyDataComponent`.
    * A standalone-only `**` route.
    * es-EC locale reachable from the exposed entry.
    * The example page stops publishing `loading` / `error` by hand.
    * Generator tests for the new placeholders.
  * **WU3 — tooling (independent):**
    * commitlint plus a husky `commit-msg` hook.
    * Coverage thresholds, set after WU1 and WU2; decide whether they block CI or warn.
  * **Housekeeping:**
    * Retire or redirect `core/mf-template`.
    * Fix copied `AGENTS.md` headers in frontcore and vbroker.
    * A lint rule banning `localStorage.clear`.
    * A CI secret scan.
* **Out-of-Scope Non-Goals:**
  * Hosted-mode error, refresh, toast and loader logic: owned by the host.
  * Logging to ms-logs: route through the host over pubsub.
  * Feature flags: no named consumer.
  * Full Playwright suite: needs a running NF host. At most one standalone smoke test or a host-harness contract test.
  * a11y components: belong in lib-components; only cheap oxlint rules here.
  * Version endpoint: at most a static `version.json` from the Docker build.
  * New empty-state or pagination UI: already in lib-components.

## Alternatives Weighed

* **Full common layer copied into the template (the original hypothesis).** Rejected: it freezes
  contract code into every fork and duplicates host behavior when hosted.
* **Contract in `@neocore/lib-components`.** Cheapest option; requires lib-components to be a strict
  singleton, which frontcore does not configure today.
* **Dedicated `@neocore/mf-runtime` package with schematics.** Cleanest boundary; costs one more package
  to release.
* **Host-injected `HostContext`.** Removes storage decryption from remotes; requires host changes, so
  it is a longer-term option.
* **Header-based opt-out instead of shared tokens.** Works without singletons; less type-safe.
* **Hygiene only until the NF host is deployed.** Minimum scope: HttpClient rule doc, 404, locale,
  coverage, retire mf-template. Defers everything host-coupled.

## Key Decisions & Staging for Next Steps

Open decisions to resolve before `/egm-draft`:

1. Do the remote's interceptors run at all in hosted mode?
2. Does any remote ever refresh the token? If so, how is the refresh locked across apps, and does the
   backend rotate refresh tokens?
3. What is the v2 → v3 storage cut-over, and the rollback plan (forced re-login)?
4. What is the promotion order (NF host first?), and which CI gate stops a remote deploying where the host is
   not NF 22?
5. What are the final opt-out token names and types, and where do they live (template, lib-components,
   or a new package)?
6. Which permission semantics win: PERMISSION only, or ROLE_PERMISSION then PERMISSION? Is the `denny`
   typo kept or fixed? What does the guard do on denial?
7. What is the value schema for each storage key, and who owns BROKER and CHANNEL?
8. Should the `loading` payload become a counter?
9. What are the coverage thresholds, and do they block CI?
10. Who owns SECRET_KEY per environment, and how is rotation coordinated?
11. In what order do the existing webpack remotes migrate to NF 22?

Top objections carried forward:

1. The HttpClient/interceptor boundary is undecided, and opt-out tokens cannot cross it.
2. The template targets a host that is not deployed yet (`quality`/`main` are Angular 17 + v2 storage).
3. Copy-paste is acceptable for tooling, not for contract code; that belongs in a versioned shared
   package.
