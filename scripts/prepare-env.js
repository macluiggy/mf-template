// Local `.env` bootstrap. Runs from the `prepare` lifecycle script
// (`bun install`), skipped in CI where the pipeline writes `.env` itself.
//
// Copies `.env.example` -> `.env` when `.env` does not exist yet, so a fresh
// clone is ready for `bun run start` without manual steps. An existing `.env`
// is NEVER overwritten: the defaults are written to `.env.ignore` instead so
// they can be diffed against the developer's own configuration.

const fs = require('node:fs');
const path = require('node:path');

if (process.env.CI) {
  process.exit(0);
}

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const envExamplePath = path.join(root, '.env.example');

if (!fs.existsSync(envExamplePath)) {
  process.exit(0);
}

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.info('[prepare-env] .env did not exist — copied from .env.example.');
} else {
  fs.copyFileSync(envExamplePath, path.join(root, '.env.ignore'));
  console.info(
    '[prepare-env] .env already exists — defaults written to .env.ignore (your .env was not touched).',
  );
}
