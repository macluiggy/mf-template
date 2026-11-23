# NEOCORE host integration

This folder is the ONLY place in the app that knows about the NEOCORE host `frontcontainer`. It
implements the ports of `src/app/core/` and is bound by a single function,
`provideNeocoreHost()`. Enable it with `TEMPLATE_PRESET=neocore` plus `SECRET_KEY` in `.env`;
`src/app/template-preset.ts` maps that name to this function.

```text
integrations/neocore/
├── neocore.providers.ts          provideNeocoreHost()
├── auth/                         AUTH_TOKEN_PROVIDER -> host ACCESS_TOKEN
├── http/                         x-device-info, x-api-key, MsPrefixEnum
├── permission/                   PermissionChecker -> ROLE_PERMISSION/PERMISSION
├── pubsub/                       PubSubService, PubSubTopic, PubSubNotifier
├── storage/                      encrypt-storage with SECRET_KEY, StorageEnum
└── testing/                      PubSub test double, tested in this folder
```

## What it binds

| Port / token            | Adapter                     | What it does                                              |
| ----------------------- | --------------------------- | --------------------------------------------------------- |
| `Notifier`              | `PubSubNotifier`            | Host loader and toasts through the PubSub topics          |
| `KeyValueStorage`       | `EncryptedKeyValueStorage`  | Encrypted localStorage shared with the host (`SECRET_KEY`) |
| `AUTH_TOKEN_PROVIDER`   | `neocoreAuthTokenProvider`  | The host's `ACCESS_TOKEN`, read on every request          |
| `PermissionChecker`     | `NeocorePermissionChecker`  | Role then user permission payloads, deny wins             |
| `APP_HTTP_INTERCEPTORS` | `deviceInfoInterceptor`     | Adds `x-device-info`                                      |

`provideTemplatePreset()` registers `provideNeocoreHost()` after `provideAppCore()` when
`TEMPLATE_PRESET=neocore`, so it overrides the safe defaults (console notifier, plain localStorage,
no token, allow-all permissions). `src/app/template-preset.ts` is the only file outside this folder
that imports it, and this folder never leaks a host detail into `core`, `shared` or a feature
module.

## How to remove NEOCORE

1. Delete `src/app/integrations/neocore/`.
2. Remove the `neocore` name from `TEMPLATE_PRESET_NAMES` and its entry from
   `TEMPLATE_PRESET_PROVIDERS` in `src/app/template-preset.ts`, and drop the `neocore` case from
   `src/app/template-preset.spec.ts`, and remove `neocore` from `TEMPLATE_PRESET_NAMES` in
   `load-env.js` (the build-time list of valid names). Remove `TEMPLATE_PRESET` (and `SECRET_KEY`) from `.env`/CI;
   `generic` is the default, so `provideAppCore()` keeps the core defaults (console logs, plain
   localStorage, no Authorization header, allow-all permissions).
3. Remove the dependencies `encrypt-storage`, `pubsub-js` and `ngx-device-detector`, plus their
   entries in the `skip` list of `federation.config.mjs`.
4. Rerun `bun run test`, `bun run build` and `bun run build:federation`. No other file references
   this folder.

The generic example module already uses only the ports, so nothing else changes: its URL comes from
`environment.apiUrl` plus a module-local path constant, and its feedback goes through `Notifier`.
