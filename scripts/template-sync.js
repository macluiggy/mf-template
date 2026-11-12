#!/usr/bin/env node
/**
 * Keeps a project created from this template up to date WITHOUT importing the
 * template's commit history.
 *
 * A project made from the template starts from a single snapshot commit and
 * records which template commit it came from in `.template-sync`. To update,
 * this script takes only the template's diff between that commit and the new
 * one, applies it to the project's working tree (three-way, so conflicts show
 * as conflict markers) and stages it. You review and make ONE commit:
 * `chore: sync <template> <old>..<new>`. No template commit ever enters the
 * project's history.
 *
 * Usage (run from the project root):
 *   node scripts/template-sync.js init --template <name> --remote <remote> --branch <branch> --sha <commit>
 *   node scripts/template-sync.js [--to <commit>]
 *
 * `.template-sync` (JSON, committed in the project):
 *   { "template": "ms-template", "remote": "template", "branch": "main", "sha": "<full sha>" }
 */
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const STATE_FILE = '.template-sync';

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', ...options }).trim();
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      args[token.slice(2)] = argv[i + 1];
      i += 1;
    } else {
      args._.push(token);
    }
  }
  return args;
}

function readState(root) {
  const file = path.join(root, STATE_FILE);
  if (!fs.existsSync(file)) {
    throw new Error(
      `${STATE_FILE} not found. Create it once with: node scripts/template-sync.js init --template <name> --remote <remote> --branch <branch> --sha <template commit this project started from>`,
    );
  }
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const key of ['template', 'remote', 'branch', 'sha']) {
    if (!state[key]) throw new Error(`${STATE_FILE} is missing "${key}".`);
  }
  return state;
}

function writeState(root, state) {
  fs.writeFileSync(
    path.join(root, STATE_FILE),
    `${JSON.stringify(state, null, 2)}\n`,
  );
}

function init(root, args) {
  for (const key of ['template', 'remote', 'branch', 'sha']) {
    if (!args[key]) throw new Error(`init needs --${key}.`);
  }
  git(['fetch', '--quiet', args.remote, args.branch], { cwd: root });
  const sha = git(['rev-parse', '--verify', `${args.sha}^{commit}`], {
    cwd: root,
  });
  writeState(root, {
    branch: args.branch,
    remote: args.remote,
    sha,
    template: args.template,
  });
  console.log(`${STATE_FILE} created at ${args.template} ${sha.slice(0, 7)}.`);
}

function sync(root, args) {
  const state = readState(root);
  if (git(['status', '--porcelain'], { cwd: root }) !== '') {
    throw new Error('The working tree is not clean: commit or stash first.');
  }
  git(['fetch', '--quiet', state.remote, state.branch], { cwd: root });
  const target = git(
    [
      'rev-parse',
      '--verify',
      `${args.to ?? `${state.remote}/${state.branch}`}^{commit}`,
    ],
    { cwd: root },
  );
  if (target === state.sha) {
    console.log(
      `Already up to date with ${state.template} ${target.slice(0, 7)}.`,
    );
    return;
  }
  const diff = execFileSync('git', ['diff', '--binary', state.sha, target], {
    cwd: root,
    maxBuffer: 256 * 1024 * 1024,
  });
  const range = `${state.sha.slice(0, 7)}..${target.slice(0, 7)}`;
  let conflicts = false;
  if (diff.length > 0) {
    const applied = spawnSync('git', ['apply', '-3', '--index', '-'], {
      cwd: root,
      encoding: 'utf8',
      input: diff,
    });
    conflicts = applied.status !== 0;
    if (applied.stderr) process.stderr.write(applied.stderr);
  }
  writeState(root, { ...state, sha: target });
  git(['add', STATE_FILE], { cwd: root });
  console.log(
    conflicts
      ? `Applied ${state.template} ${range} WITH CONFLICTS: fix the conflict markers, \`git add\` the files, then commit.`
      : `Applied ${state.template} ${range}. Review \`git diff --cached\`, then commit.`,
  );
  console.log(`Suggested message: chore: sync ${state.template} ${range}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = git(['rev-parse', '--show-toplevel']);
  if (args._[0] === 'init') init(root, args);
  else sync(root, args);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[template-sync] ${error.message}`);
    process.exit(1);
  }
}

module.exports = { parseArgs, readState, writeState };
