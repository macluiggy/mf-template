// Generator for files shared by every micro-frontend (starting with
// .gitlab-ci.yml). Same model as backtemplate's scaffold: one canonical
// template, every per-repo value derived from `--service`.
// CJS, zero dependencies, `--flag=value` parsing like scripts/generate-module.js.
//
// This scaffold is the NEOCORE GitLab CI PRESET. A repo that does not deploy
// to the NEOCORE fleet can still use it, but the `mf-` service prefix is only
// a convention there: a service without it is accepted with a warning.
const fs = require('node:fs');
const path = require('node:path');

const SCAFFOLD_DIR = __dirname;
const CONFIG_PATH = path.join(SCAFFOLD_DIR, 'scaffold.config.json');
// Convention of the NEOCORE fleet, not a requirement of the generator.
const SERVICE_PREFIX = 'mf-';
// Written by every build_app `.env` heredoc; extra keys cannot repeat them.
const BASE_ENV_KEYS = ['NODE_ENV', 'API_URL', 'ENTITY_ROOT', 'SECRET_KEY'];
const ENV_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

function printUsage() {
  console.log(`Usage:
  node scaffold/generate.js --service=<mf-name> --target=<path> [options]

Required:
  --service=<mf-name>   Micro-frontend name, e.g. mf-virtual-office. All tokens derive from it.
                         The "mf-" prefix is the NEOCORE convention: without it the generator
                         warns and derives the tokens from the full name.
  --target=<path>       Target repo where files are written. "." for front-template itself.

Options:
  --only=<id[,id]>      Generate only certain files by id (see scaffold.config.json).
  --dry-run             Print the result to stdout, write nothing.
  --force               Overwrite the target file if it already exists.

Per-token overrides (only for a repo that deviates from the pattern):
  --service-name=  --container-name=  --compose-image-var=  --runner-tag=
  --compose-base-dev=  --compose-base-qa=  --compose-base-preprod=  --npm-project-id=
  --service-name-dev=  --service-name-qa=  --service-name-preprod=
                        (compose service key of one environment; default --service-name)

Fork-specific build variables (values come from GitLab CI/CD variables of the same name):
  --extra-env-keys=KEY[,KEY]   Extra KEY=$KEY lines in build_app's .env heredoc.

Example:
  node scaffold/generate.js --service=mf-virtual-office --target=../frontvirtualoffice --dry-run`);
}

// `--flag=value` -> { flag: 'value' }; a flag without `=` becomes `true`.
function parseArgs(argv) {
  const parsed = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const withoutPrefix = raw.slice(2);
    const eqIndex = withoutPrefix.indexOf('=');
    if (eqIndex === -1) {
      parsed[withoutPrefix] = true;
    } else {
      parsed[withoutPrefix.slice(0, eqIndex)] = withoutPrefix.slice(
        eqIndex + 1,
      );
    }
  }
  return parsed;
}

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

// A service without the NEOCORE `mf-` prefix is accepted: the tokens are
// derived from the whole name and the caller gets a warning.
function serviceWarning(service) {
  if (service.startsWith(SERVICE_PREFIX)) return null;
  return `warning: service "${service}" does not start with "${SERVICE_PREFIX}" (NEOCORE convention); its tokens are derived from the full name`;
}

// mf-virtual-office -> SERVICE_NAME/CONTAINER_NAME mf-virtual-office,
// COMPOSE_IMAGE_VAR FRONT_VIRTUAL_OFFICE_IMAGE_COMMIT, COMPOSE_FILE_* <base>/mf-virtual-office.yml.
function derive(service, shared, overrides = {}) {
  const bare = service.startsWith(SERVICE_PREFIX)
    ? service.slice(SERVICE_PREFIX.length)
    : service;
  const serviceName = overrides['service-name'] ?? service;
  const composeFile = (env) =>
    `${overrides[`compose-base-${env}`] ?? shared.composeBasePaths[env]}/${service}.yml`;

  return {
    COMPOSE_FILE_DEV: composeFile('dev'),
    COMPOSE_FILE_PREPROD: composeFile('preprod'),
    COMPOSE_FILE_QA: composeFile('qa'),
    COMPOSE_IMAGE_VAR:
      overrides['compose-image-var'] ??
      `FRONT_${bare.toUpperCase().replace(/-/g, '_')}_IMAGE_COMMIT`,
    CONTAINER_NAME: overrides['container-name'] ?? service,
    EXTRA_ENV_LINES: extraEnvLines(overrides['extra-env-keys']),
    NEOCORE_NPM_PROJECT_ID: overrides['npm-project-id'] ?? shared.npmProjectId,
    RUNNER_TAG: overrides['runner-tag'] ?? shared.runnerTag,
    SERVICE_NAME: serviceName,
    // Some servers key the same app differently in their compose.
    SERVICE_NAME_DEV: overrides['service-name-dev'] ?? serviceName,
    SERVICE_NAME_PREPROD: overrides['service-name-preprod'] ?? serviceName,
    SERVICE_NAME_QA: overrides['service-name-qa'] ?? serviceName,
  };
}

// `ZOHO_URL,ZOHO_ORG_ID` -> ['ZOHO_URL=$ZOHO_URL', 'ZOHO_ORG_ID=$ZOHO_ORG_ID'].
function extraEnvLines(csv = '') {
  const keys = csv
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
  keys.forEach((key, index) => {
    if (!ENV_KEY_PATTERN.test(key))
      throw new Error(`invalid extra env key "${key}"`);
    if (BASE_ENV_KEYS.includes(key))
      throw new Error(`"${key}" is already written by the template`);
    if (keys.indexOf(key) !== index)
      throw new Error(`duplicated extra env key "${key}"`);
  });
  return keys.map((key) => `${key}=$${key}`);
}

// CRLF -> LF so the output does not depend on the checkout's line endings.
function toLf(content) {
  return content.replace(/\r\n/g, '\n');
}

// Only known tokens are replaced: other `{{...}}` (e.g. docker --format) stay.
// A list token must sit alone on its line: it expands to one line per item
// with the same indentation, and an empty list removes the line.
function substituteTokens(template, tokens) {
  let result = template;
  for (const [token, value] of Object.entries(tokens)) {
    if (Array.isArray(value)) {
      const line = new RegExp(`^([ \\t]*)\\{\\{${token}\\}\\}\\n`, 'gm');
      result = result.replace(line, (_match, indent) =>
        value.map((item) => `${indent}${item}\n`).join(''),
      );
    } else {
      result = result.split(`{{${token}}}`).join(value);
    }
  }
  return result;
}

// The regenerate command records the overrides too, so the banner alone is
// enough to reproduce the file (the drift test parses it).
function buildBanner(templatePath, service, targetLabel, overrides) {
  const overrideArgs = Object.entries(overrides).map(
    ([flag, value]) => ` --${flag}=${value}`,
  );
  return [
    '# ─────────────────────────────────────────────────────────────',
    '# ⚠️  GENERATED FILE — do not edit by hand.',
    `# Source: front-template/scaffold/${templatePath.replace(/\\/g, '/')}`,
    `# Regenerate: node scaffold/generate.js --service=${service} --target=${targetLabel}${overrideArgs.join('')} --force`,
    '# ─────────────────────────────────────────────────────────────',
    '',
  ].join('\n');
}

// Pure rendering of one configured file; shared by the CLI and the drift test.
function render(file, service, targetLabel, overrides = {}) {
  const { shared } = readConfig();
  const tokens = derive(service, shared, overrides);
  const template = toLf(
    fs.readFileSync(path.join(SCAFFOLD_DIR, file.template), 'utf8'),
  );
  return `${buildBanner(file.template, service, targetLabel, overrides)}${substituteTokens(template, tokens)}`;
}

const OVERRIDE_FLAGS = [
  'service-name',
  'service-name-dev',
  'service-name-qa',
  'service-name-preprod',
  'container-name',
  'compose-image-var',
  'runner-tag',
  'compose-base-dev',
  'compose-base-qa',
  'compose-base-preprod',
  'npm-project-id',
  'extra-env-keys',
];

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (Object.keys(args).length === 0) {
    printUsage();
    process.exit(1);
  }

  const { service, target } = args;
  if (typeof service !== 'string') fail('--service=<mf-name> is required.');
  if (typeof target !== 'string') fail('--target=<path> is required.');
  const warning = serviceWarning(service);
  if (warning) console.error(warning);

  const targetDir = path.resolve(process.cwd(), target);
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    fail(`--target directory not found: ${targetDir}`);
  }

  const overrides = {};
  for (const flag of OVERRIDE_FLAGS) {
    if (typeof args[flag] === 'string') overrides[flag] = args[flag];
  }
  try {
    derive(service, readConfig().shared, overrides);
  } catch (error) {
    fail(error.message);
  }

  const onlyIds =
    typeof args.only === 'string'
      ? args.only.split(',').map((id) => id.trim())
      : null;
  const files = readConfig().files.filter(
    (file) => !onlyIds || onlyIds.includes(file.id),
  );
  if (files.length === 0)
    fail('no matching files to generate (check --only=<id[,id]>).');

  for (const file of files) {
    const content = render(file, service, target, overrides);
    const outputPath = path.join(targetDir, file.output);

    if (args['dry-run']) {
      console.log(
        `\n--- ${file.id} → ${file.output} (dry-run, not written) ---\n${content}`,
      );
      continue;
    }
    if (fs.existsSync(outputPath) && !args.force) {
      fail(
        `target file already exists: ${outputPath}\n       Use --force to overwrite.`,
      );
    }
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`[scaffold] ${file.id} → ${outputPath}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { derive, parseArgs, readConfig, render, serviceWarning };
