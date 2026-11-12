// Dates use Temporal, never the legacy `Date`: the lint rule enforces it, the
// polyfill covers browsers without native Temporal (Safari/iOS), and the
// exposed routes load it themselves because a host does not run a remote's
// `polyfills`.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('lint rejects the legacy Date global', () => {
  const probe = path.join(root, 'src', 'temporal-lint-probe.ts');
  fs.writeFileSync(
    probe,
    'export const created = new Date();\nexport const now = Date.now();\n',
  );
  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(root, 'node_modules', 'oxlint', 'bin', 'oxlint'),
        'src/temporal-lint-probe.ts',
      ],
      { cwd: root, encoding: 'utf8' },
    );
    const output = `${result.stdout}${result.stderr}`;
    assert.notEqual(result.status, 0, output);
    assert.equal(
      (output.match(/no-restricted-globals/g) ?? []).length,
      2,
      output,
    );
    assert.match(output, /Use Temporal/);
  } finally {
    fs.rmSync(probe, { force: true });
  }
});

test('standalone builds and tests load the Temporal polyfill', () => {
  // Forks rename the project: read the only one instead of `mf-template`.
  const [project] = Object.values(JSON.parse(read('angular.json')).projects);
  const { architect } = project;
  for (const target of ['build', 'build-test']) {
    assert.ok(
      architect[target].options.polyfills?.includes('temporal-polyfill/global'),
      `${target} polyfills must include temporal-polyfill/global`,
    );
  }
});

test('the exposed routes load the polyfill themselves for hosted mode', () => {
  assert.match(
    read('src/app/modules/template/template.routes.ts'),
    /^import 'temporal-polyfill\/global';$/m,
  );
});
