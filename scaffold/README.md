# Scaffold: the NEOCORE GitLab CI preset

Generated shared files for the **NEOCORE GitLab preset**: the pipeline that a repo of the NEOCORE
fleet deploys with (gitads registry, `nc_core` runners, SSH deploy to the compose file that lives on
each server). The generic CI of this template is `.github/workflows/ci.yml`, and that one is edited
by hand.

This scaffold is the single source of truth for those files, same model as backtemplate's
`scaffold/`. A fix to the pipeline is made once in `templates/` and regenerated per repo, instead of
copied by hand fork by fork.

```bash
node scaffold/generate.js --service=<mf-name> --target=<path> [options]
```

| Flag                  | Required | Description                                                              |
| --------------------- | -------- | ------------------------------------------------------------------------ |
| `--service=<mf-name>` | yes      | Micro-frontend name, e.g. `mf-virtual-office`. Every token derives from it. |
| `--target=<path>`     | yes      | Repo the files are written to. `.` for the repo itself.                  |
| `--only=<id[,id]>`    | no       | Generate only some files by `id` (see `scaffold.config.json`).           |
| `--dry-run`           | no       | Print the result, write nothing.                                         |
| `--force`             | no       | Overwrite an existing target file (refused otherwise).                   |

The `mf-` prefix is the NEOCORE convention, not a requirement: a service without it is accepted and
the generator prints a warning (the tokens are derived from the full name).

## Derivation (`--service=mf-virtual-office`)

| Token                       | Value                                                    | Override                  |
| --------------------------- | -------------------------------------------------------- | ------------------------- |
| `SERVICE_NAME`              | `mf-virtual-office` (service key in the server compose)  | `--service-name=`         |
| `SERVICE_NAME_DEV/QA/PREPROD` | `SERVICE_NAME`, per environment (each deploy job uses its own) | `--service-name-dev=` etc. |
| `CONTAINER_NAME`            | `mf-virtual-office`                                      | `--container-name=`       |
| `COMPOSE_IMAGE_VAR`         | `FRONT_VIRTUAL_OFFICE_IMAGE_COMMIT`                      | `--compose-image-var=`    |
| `COMPOSE_FILE_DEV/QA/PREPROD` | `<composeBasePaths.*>/mf-virtual-office.yml`           | `--compose-base-dev=` etc. |
| `RUNNER_TAG`                | `shared.runnerTag`                                       | `--runner-tag=`           |
| `NEOCORE_NPM_PROJECT_ID`    | `shared.npmProjectId` (internal npm registry)            | `--npm-project-id=`       |

Fork-specific build variables: `--extra-env-keys=ZOHO_URL,ZOHO_ORG_ID` adds `ZOHO_URL=$ZOHO_URL`
(one line per key) to `build_app`'s `.env` heredoc. Keys are `UPPER_SNAKE_CASE`, unique, and cannot
repeat the base ones (`NODE_ENV`, `API_URL`, `ENTITY_ROOT`, `SECRET_KEY`); the values are GitLab
CI/CD variables with the same name.

Overrides are for repos whose server compose deviates from the pattern (e.g. the NEOCORE host
container: `--service=mf-container --service-name=container`). When only one server keys the app
differently, override just that environment (the core app uses `--service-name=core
--service-name-dev=mf-core`). They are recorded in the generated banner's `Regenerate:` command, so
that line alone reproduces the file.

## Regenerate to update

1. Edit `templates/gitlab-ci.yml` (or the shared values in `scaffold.config.json`).
2. Run the `Regenerate:` command from the target file's banner.
3. Review and commit the diff in the target repo.

`scripts/gitlab-ci-scaffold.test.js` re-renders from the banner and fails if `.gitlab-ci.yml` was
edited by hand.

## Adding a generated file

Add the template under `templates/` and an entry to `files[]` in `scaffold.config.json`
(`id`, `template`, `output`). `generate.js` needs no change.

## Out of scope

- Server-side compose files and GitLab CI/CD secrets.
- Bulk regeneration of every fork (`--all`).
