#!/usr/bin/env node
/**
 * Build-time environment loader.
 *
 * Bakes the variables of `.env` into `src/environments/environment.ts` (and its
 * interface). Both files are generated and gitignored: never edit them by hand.
 *
 * Sources, in order:
 *   1. `.env` (falls back to `.env.example` with a warning on a fresh clone).
 *   2. Optional remote config from `${API_URL}/ms-core/parameter/env`. This call
 *      is best-effort: when it fails (offline, API down, timeout) the build
 *      continues with the `.env` values only and prints a warning.
 *
 * Flags (environment variables):
 *   SKIP_ENV_FETCH=1        skip the remote call (used by `bun run test`).
 *   ENV_FETCH_TIMEOUT_MS    remote call timeout, default 5000.
 *   NODE_ENV=DEV|PROD       sets `environment.production` (default DEV).
 */

const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const env = require('./scripts/env-helper');

const ROOT = __dirname;
const ENV_FILE = path.join(ROOT, '.env');
const ENV_EXAMPLE_FILE = path.join(ROOT, '.env.example');
const TARGET_DIR = path.join(ROOT, 'src/environments');
const TARGET_FILE = path.join(TARGET_DIR, 'environment.ts');
const INTERFACE_FILE = path.join(TARGET_DIR, 'environment.interface.ts');

const REQUIRED_VARS = ['API_URL', 'SECRET_KEY', 'ENTITY_ROOT'];
const SENSITIVE_KEYS = new Set(['SECRET_KEY']);
const REQUEST_TIMEOUT_MS = Number(process.env.ENV_FETCH_TIMEOUT_MS) || 5_000;
const SKIP_REMOTE = ['1', 'true', 'yes'].includes(
  String(process.env.SKIP_ENV_FETCH ?? '').toLowerCase(),
);

const log = {
  ok: (msg) => console.info(`\x1b[32m✓\x1b[0m ${msg}`),
  warn: (msg) => console.warn(`\x1b[33m⚠\x1b[0m ${msg}`),
  fail: (msg) => console.error(`\x1b[31m✗\x1b[0m ${msg}`),
  info: (msg) => console.info(`\x1b[36mℹ\x1b[0m ${msg}`),
};

const mask = (value) => {
  if (!value) return '(empty)';
  if (value.length <= 6) return '***';
  return `${value.slice(0, 2)}***${value.slice(-2)} (len=${value.length})`;
};

function loadDotenv() {
  if (fs.existsSync(ENV_FILE)) {
    // Standard dotenv precedence: variables already set in the process (CI job
    // variables, `SECRET_KEY=... bun run build`) win over the .env file.
    dotenv.config({ path: ENV_FILE, quiet: true });
    return;
  }
  if (fs.existsSync(ENV_EXAMPLE_FILE)) {
    log.warn('.env not found — using .env.example defaults (run `bun install` to create .env).');
    // No override: real environment variables (CI) still win over the example.
    dotenv.config({ path: ENV_EXAMPLE_FILE, quiet: true });
    return;
  }
  log.warn('Neither .env nor .env.example found — relying on process environment only.');
}

function readBaseConfig() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  // encrypt-storage rejects secrets shorter than 10 characters at runtime;
  // fail here instead of shipping a bundle that crashes on first storage access.
  if (process.env.SECRET_KEY.length < 10) {
    throw new Error('SECRET_KEY must have at least 10 characters (and match the host).');
  }
  return {
    production: env.get('NODE_ENV').default('DEV').asEnum(['DEV', 'PROD']) === 'PROD',
    apiUrl: env.get('API_URL').required().asUrlString(),
    secretKey: env.get('SECRET_KEY').required().asString(),
    entityRoot: env.get('ENTITY_ROOT').required().asString(),
  };
}

/**
 * Optional extra properties published by ms-core. Never fails the build.
 * @param {string} apiUrl
 * @returns {Promise<Record<string, unknown>>}
 */
async function fetchRemoteConfig(apiUrl) {
  if (SKIP_REMOTE) {
    log.info('SKIP_ENV_FETCH set — skipping remote environment config.');
    return {};
  }
  const url = `${apiUrl.replace(/\/+$/, '')}/ms-core/parameter/env`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    const data = body?.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    log.ok(`Remote environment config loaded from ${url}`);
    return data;
  } catch (err) {
    log.warn(`Could not fetch ${url} (${err.message}) — continuing with .env values only.`);
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
  const baseKeys = new Set(Object.keys(baseConfig).map((key) => key.toLowerCase()));
  const extra = Object.entries(remoteConfig).filter(
    ([key]) => IDENTIFIER.test(key) && !baseKeys.has(key.toLowerCase()),
  );

  const header = `/**
 * Auto-generated by load-env.js — do not edit, change .env instead.
 * Generated: ${new Date().toISOString()}
 */`;

  const interfaceContent = `${header}
export interface Environment {
  production: boolean;
  apiUrl: string;
  secretKey: string;
  entityRoot: string;
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
    const value = process.env[key];
    log.info(`${key.padEnd(12)} = ${SENSITIVE_KEYS.has(key) ? mask(value) : value}`);
  }
  const remoteConfig = await fetchRemoteConfig(baseConfig.apiUrl);
  writeFiles(baseConfig, remoteConfig);
}

main().catch((err) => {
  log.fail(`Environment generation failed: ${err.message}`);
  process.exit(1);
});
