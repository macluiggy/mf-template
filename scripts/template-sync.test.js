const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const SCRIPT = path.join(__dirname, 'template-sync.js');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function run(cwd, ...args) {
  return execFileSync('node', [SCRIPT, ...args], { cwd, encoding: 'utf8' });
}

function newRepo(dir) {
  fs.mkdirSync(dir, { recursive: true });
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'user.name', 'Test');
  git(dir, 'config', 'commit.gpgsign', 'false');
}

function commit(dir, file, content, message) {
  fs.writeFileSync(path.join(dir, file), content);
  git(dir, 'add', file);
  git(dir, 'commit', '-q', '--no-verify', '-m', message);
  return git(dir, 'rev-parse', 'HEAD');
}

function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'template-sync-'));
  const template = path.join(root, 'template');
  const project = path.join(root, 'project');
  newRepo(template);
  commit(template, 'a.txt', 'one\n', 'feat: a');
  const start = commit(template, 'b.txt', 'two\n', 'feat: b');
  // The project starts as a single snapshot commit of the template.
  newRepo(project);
  fs.copyFileSync(path.join(template, 'a.txt'), path.join(project, 'a.txt'));
  fs.copyFileSync(path.join(template, 'b.txt'), path.join(project, 'b.txt'));
  git(project, 'remote', 'add', 'template', template);
  run(
    project,
    'init',
    '--template',
    'demo',
    '--remote',
    'template',
    '--branch',
    'main',
    '--sha',
    start,
  );
  git(project, 'add', '-A');
  git(project, 'commit', '-q', '--no-verify', '-m', 'chore: initial commit');
  return { project, root, start, template };
}

test('init records the template commit the project started from', () => {
  const { project, root, start } = setup();
  try {
    const state = JSON.parse(
      fs.readFileSync(path.join(project, '.template-sync'), 'utf8'),
    );
    assert.deepEqual(state, {
      branch: 'main',
      remote: 'template',
      sha: start,
      template: 'demo',
    });
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

test('sync stages only the template diff and imports no template commit', () => {
  const { project, root, template } = setup();
  try {
    const target = commit(template, 'a.txt', 'one\nthree\n', 'feat: more');
    const output = run(project);

    assert.match(output, /Applied demo/);
    assert.equal(
      fs.readFileSync(path.join(project, 'a.txt'), 'utf8'),
      'one\nthree\n',
    );
    const staged = git(project, 'diff', '--cached', '--name-only').split('\n');
    assert.deepEqual(staged.toSorted(), ['.template-sync', 'a.txt']);
    const state = JSON.parse(
      fs.readFileSync(path.join(project, '.template-sync'), 'utf8'),
    );
    assert.equal(state.sha, target);

    git(project, 'commit', '-q', '--no-verify', '-m', 'chore: sync');
    assert.equal(git(project, 'rev-list', '--count', 'HEAD'), '2');
    // Exit 1 = the template commit is NOT in the project's history.
    const ancestor = spawnSync(
      'git',
      ['merge-base', '--is-ancestor', target, 'HEAD'],
      { cwd: project },
    );
    assert.equal(ancestor.status, 1);
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

test('sync reports when the project is already up to date', () => {
  const { project, root } = setup();
  try {
    assert.match(run(project), /Already up to date/);
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

test('sync keeps project changes and marks a conflict on the same line', () => {
  const { project, root, template } = setup();
  try {
    commit(project, 'b.txt', 'two (project)\n', 'feat: project edit');
    commit(template, 'b.txt', 'two (template)\n', 'feat: template edit');
    const output = run(project);

    assert.match(output, /WITH CONFLICTS/);
    const merged = fs.readFileSync(path.join(project, 'b.txt'), 'utf8');
    assert.match(merged, /two \(project\)/);
    assert.match(merged, /two \(template\)/);
    assert.match(merged, /<<<<<<< /);
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});

test('sync refuses to run on a dirty working tree', () => {
  const { project, root } = setup();
  try {
    fs.writeFileSync(path.join(project, 'b.txt'), 'local edit\n');
    assert.throws(() => run(project), /not clean/);
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
});
