#!/usr/bin/env node
/**
 * Build-time environment loader.
 *
 * Bakes the variables of `.env` into `src/environments/environment.ts` (and its
 * interface). Both files are generated and gitignored: never edit them by hand.
 *
 * Only `API_URL` is required: the template is a plain Angular app. The NEOCORE
 * preset adds `SECRET_KEY` and `ENTITY_ROOT`, both optional.
 *
 * Sources, in order:
 *   1. `.env` (falls back to `.env.example` with a warning on a fresh clone).
 *   2. Optional remote config from `ENV_REMOTE_URL` (opt-in). This call is
 *      best-effort: when it fails (offline, API down, timeout) the build
 *      continues with the `.env` values only and prints a warning.
 *
 * Flags (environment variables):
 *   ENV_REMOTE_URL         full URL of the remote env document to GET. The
 *                           remote call only happens when it is set (NEOCORE:
 *                           `${API_URL}/ms-core/parameter/env`).
 *   SKIP_ENV_FETCH=1       hard off switch for the remote call, even when
 *                           ENV_REMOTE_URL is set (used by `bun run test`).
 *   --example              read only .env.example, never .env (used by
 *                           `bun run test`, so tests do not depend on the
 *                           developer's local .env).
 *   ENV_FETCH_TIMEOUT_MS   remote call timeout, default 5000.
 *   NODE_ENV=DEV|PROD      sets `environment.production` (default DEV).
 */

const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const env = require('./scripts/env-helper');
// Node 26 ships Temporal; older runtimes fall back to the polyfill the app
// already depends on, without installing it globally.
const { Temporal } = globalThis.Temporal
  ? globalThis
  : require('temporal-polyfill');

const ROOT = __dirname;
const ENV_FILE = path.join(ROOT, '.env');
const ENV_EXAMPLE_FILE = path.join(ROOT, '.env.example');
const TARGET_DIR = path.join(ROOT, 'src/environments');
const TARGET_FILE = path.join(TARGET_DIR, 'environment.ts');
const INTERFACE_FILE = path.join(TARGET_DIR, 'environment.interface.ts');

// The only variable every app needs.
const REQUIRED_VARS = ['API_URL'];
// NEOCORE preset only: optional, and ignored by a plain app.
const OPTIONAL_VARS = ['SECRET_KEY', 'ENTITY_ROOT'];
// Reserved names: the remote config can never overwrite them.
const BASE_KEYS = ['production', 'apiUrl', 'secretKey', 'entityRoot'];
const SENSITIVE_KEYS = new Set(['SECRET_KEY']);

const log = {
  fail: (msg) => console.error(`\x1b[31m✗\x1b[0m ${msg}`),
  info: (msg) => console.info(`\x1b[36mℹ\x1b[0m ${msg}`),
  ok: (msg) => console.info(`\x1b[32m✓\x1b[0m ${msg}`),
  warn: (msg) => console.warn(`\x1b[33m⚠\x1b[0m ${msg}`),
};

const mask = (value) => {
  if (!value) return '(empty)';
  if (value.length <= 6) return '***';
  return `${value.slice(0, 2)}***${value.slice(-2)} (len=${value.length})`;
};

const USE_EXAMPLE = process.argv.includes('--example');

/**
 * Reads an optional variable. Empty and whitespace-only values count as unset
 * (CI writes `KEY=` when the variable is not configured).
 * @param {string} name Variable name
 * @returns {string | undefined} The trimmed value, or undefined when unset
 */
function optionalVar(name) {
  const value = process.env[name];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * The remote call is opt-in and can always be turned off.
 * @returns {boolean} true when the remote config must not be fetched
 */
function skipRemote() {
  return ['1', 'true', 'yes'].includes(
    String(process.env.SKIP_ENV_FETCH ?? '').toLowerCase(),
  );
}

function loadDotenv() {
  if (USE_EXAMPLE) {
    log.info('--example: reading .env.example only (.env is ignored).');
    // No override: real environment variables (CI) still win over the example.
    dotenv.config({ path: ENV_EXAMPLE_FILE, quiet: true });
    return;
  }
  if (fs.existsSync(ENV_FILE)) {
    // Standard dotenv precedence: variables already set in the process (CI job
    // variables, `SECRET_KEY=... bun run build`) win over the .env file.
    dotenv.config({ path: ENV_FILE, quiet: true });
    return;
  }
  if (fs.existsSync(ENV_EXAMPLE_FILE)) {
    log.warn(
      '.env not found — using .env.example defaults (run `bun install` to create .env).',
    );
    // No override: real environment variables (CI) still win over the example.
    dotenv.config({ path: ENV_EXAMPLE_FILE, quiet: true });
    return;
  }
  log.warn(
    'Neither .env nor .env.example found — relying on process environment only.',
  );
}

function readBaseConfig() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
  const baseConfig = {
    apiUrl: env.get('API_URL').required().asUrlString(),
    production:
      env.get('NODE_ENV').default('DEV').asEnum(['DEV', 'PROD']) === 'PROD',
  };
  // SECRET_KEY is only needed by the NEOCORE integration (provideNeocoreHost()):
  // the host encrypts the access token with it, so it must match the host's.
  // Optional for a plain app, but when it is set it must be valid:
  // encrypt-storage rejects secrets shorter than 10 characters at runtime; fail
  // here instead of shipping a bundle that crashes on the first storage access.
  const secretKey = optionalVar('SECRET_KEY');
  if (secretKey !== undefined) {
    if (secretKey.length < 10) {
      throw new Error(
        'SECRET_KEY must have at least 10 characters (only the NEOCORE integration needs it, and it must match the host).',
      );
    }
    baseConfig.secretKey = secretKey;
  }
  const entityRoot = optionalVar('ENTITY_ROOT');
  if (entityRoot !== undefined) baseConfig.entityRoot = entityRoot;
  return baseConfig;
}

/**
 * Optional extra properties published by a remote config endpoint. Opt-in: the
 * call only happens when `ENV_REMOTE_URL` is set. Never fails the build.
 * @returns {Promise<Record<string, unknown>>}
 */
async function fetchRemoteConfig() {
  if (skipRemote()) {
    log.info('SKIP_ENV_FETCH set — skipping remote environment config.');
    return {};
  }
  const remoteUrl = optionalVar('ENV_REMOTE_URL');
  if (remoteUrl === undefined) {
    log.info(
      'ENV_REMOTE_URL not set — remote environment config is opt-in, skipping.',
    );
    return {};
  }
  const timeout = Number(process.env.ENV_FETCH_TIMEOUT_MS) || 5_000;
  try {
    const url = env.get('ENV_REMOTE_URL').asUrlString();
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    // NEOCORE publishes `{ data: {...} }`; a plain JSON object works too.
    const data = body?.data ?? body;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    log.ok(`Remote environment config loaded from ${url}`);
    return data;
  } catch (err) {
    log.warn(
      `Could not fetch ${remoteUrl} (${err.message}) — continuing with .env values only.`,
    );
    return {};
  }
}

function tsTypeOf(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  if (Array.isArray(value)) return 'unknown[]';
  if (value && typeof value === 'object') return 'Record<string, unknown>';
  return 'unknown';
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function writeFiles(baseConfig, remoteConfig) {
  const baseKeys = new Set(BASE_KEYS.map((key) => key.toLowerCase()));
  const extra = Object.entries(remoteConfig).filter(
    ([key]) => IDENTIFIER.test(key) && !baseKeys.has(key.toLowerCase()),
  );

  const header = `/**
 * Auto-generated by load-env.js — do not edit, change .env instead.
 * Generated: ${Temporal.Now.instant().toString({ smallestUnit: 'second' })}
 */`;

  // `secretKey` and `entityRoot` are optional: they exist only with the
  // NEOCORE preset (SECRET_KEY / ENTITY_ROOT in the environment). The optional
  // marker keeps the type stable for apps that never set them.
  const interfaceContent = `${header}
export interface Environment {
  production: boolean;
  apiUrl: string;
  /** NEOCORE preset only: present when SECRET_KEY is set. */
  secretKey?: string;
  /** NEOCORE preset only: present when ENTITY_ROOT is set. */
  entityRoot?: string;
${extra.map(([key, value]) => `  ${key}?: ${tsTypeOf(value)};`).join('\n')}
}
`;

  const values = [...Object.entries(baseConfig), ...extra]
    .map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`)
    .join('\n');

  const environmentContent = `${header}
import type { Environment } from './environment.interface';

export const environment: Environment = {
${values}
};
`;

  fs.mkdirSync(TARGET_DIR, { recursive: true });
  fs.writeFileSync(INTERFACE_FILE, interfaceContent, 'utf-8');
  fs.writeFileSync(TARGET_FILE, environmentContent, 'utf-8');
  log.ok(
    `Generated ${path.relative(ROOT, TARGET_FILE)} and ${path.relative(ROOT, INTERFACE_FILE)}`,
  );
}

async function main() {
  loadDotenv();
  const baseConfig = readBaseConfig();
  for (const key of REQUIRED_VARS) {
    log.info(`${key.padEnd(12)} = ${process.env[key]}`);
  }
  for (const key of OPTIONAL_VARS) {
    const value = optionalVar(key);
    if (value === undefined) {
      log.info(`${key.padEnd(12)} = (not set)`);
      continue;
    }
    log.info(
      `${key.padEnd(12)} = ${SENSITIVE_KEYS.has(key) ? mask(value) : value}`,
    );
  }
  const remoteConfig = await fetchRemoteConfig();
  writeFiles(baseConfig, remoteConfig);
}

main().catch((err) => {
  log.fail(`Environment generation failed: ${err.message}`);
  process.exit(1);
});
