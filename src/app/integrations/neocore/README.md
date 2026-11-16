# NEOCORE host integration

This folder is the ONLY place in the app that knows about the NEOCORE host `frontcontainer`. It
implements the ports of `src/app/core/` and is bound by a single function,
`provideNeocoreHost()`.

```text
integrations/neocore/
├── neocore.providers.ts          provideNeocoreHost()
├── auth/                         AUTH_TOKEN_PROVIDER -> host ACCESS_TOKEN
├── http/                         x-device-info, x-api-key, MsPrefixEnum
├── permission/                   PermissionChecker -> ROLE_PERMISSION/PERMISSION
├── pubsub/                       PubSubService, PubSubTopic, PubSubNotifier
├── storage/                      encrypt-storage with SECRET_KEY, StorageEnum
└── testing/                      PubSub test double (re-exported from src/testing)
```

## What it binds

| Port / token            | Adapter                     | What it does                                              |
| ----------------------- | --------------------------- | --------------------------------------------------------- |
| `Notifier`              | `PubSubNotifier`            | Host loader and toasts through the PubSub topics          |
| `KeyValueStorage`       | `EncryptedKeyValueStorage`  | Encrypted localStorage shared with the host (`SECRET_KEY`) |
| `AUTH_TOKEN_PROVIDER`   | `neocoreAuthTokenProvider`  | The host's `ACCESS_TOKEN`, read on every request          |
| `PermissionChecker`     | `NeocorePermissionChecker`  | Role then user permission payloads, deny wins             |
| `APP_HTTP_INTERCEPTORS` | `deviceInfoInterceptor`     | Adds `x-device-info`                                      |

`provideNeocoreHost()` is registered after `provideAppCore()`, so it overrides the safe defaults
(console notifier, plain localStorage, no token, allow-all permissions). Nothing outside this folder
imports it, and this folder never leaks a host detail into `core`, `shared` or a feature module.

## How to remove NEOCORE

1. Delete `src/app/integrations/neocore/`.
2. Remove the two `provideNeocoreHost()` calls (each has a `NEOCORE host adapters` comment):
   - `src/app/app.config.ts`
   - the exposed routes (`src/app/modules/template/template.routes.ts`, and every exposed
     `<feature>.routes.ts`)
3. Keep `provideAppCore()` and `provideAppHttpClient()`: the app now runs fully standalone with the
   core defaults (console logs, plain localStorage, no Authorization header, allow-all permissions).
4. Drop `SECRET_KEY` from `.env`/CI and rerun `bun run test`, `bun run build` and
   `bun run build:federation`. No other file references this folder.

The generic example module already uses only the ports, so nothing else changes: its URL comes from
`environment.apiUrl` plus a module-local path constant, and its feedback goes through `Notifier`.
