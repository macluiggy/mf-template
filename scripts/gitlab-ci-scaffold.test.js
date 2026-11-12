// The committed `.gitlab-ci.yml` must be exactly what the scaffold generates
// for this repo: editing it by hand (instead of the template) fails here.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const {
  derive,
  parseArgs,
  readConfig,
  render,
  serviceWarning,
} = require('../scaffold/generate.js');

const root = path.join(__dirname, '..');

// The banner's "Regenerate:" line holds the service and overrides this repo
// was generated with, so a fork runs this same test without editing it.
test('.gitlab-ci.yml matches the scaffold output recorded in its banner', () => {
  const file = readConfig().files.find((entry) => entry.id === 'gitlab-ci');
  const committed = fs
    .readFileSync(path.join(root, file.output), 'utf8')
    .replace(/\r\n/g, '\n');
  const command = committed.match(
    /^# Regenerate: (node scaffold\/generate\.js .+)$/m,
  );
  assert.ok(
    command,
    `${file.output} has no generated banner: run node scaffold/generate.js`,
  );

  const {
    service,
    target,
    force: _force,
    ...overrides
  } = parseArgs(command[1].split(' '));
  assert.equal(
    committed,
    render(file, service, target, overrides),
    `Edit scaffold/templates/gitlab-ci.yml, then run: ${command[1]}`,
  );
});

test('derive builds every token from the service name', () => {
  const tokens = derive('mf-virtual-office', readConfig().shared);

  assert.equal(tokens.SERVICE_NAME, 'mf-virtual-office');
  assert.equal(tokens.CONTAINER_NAME, 'mf-virtual-office');
  assert.equal(tokens.COMPOSE_IMAGE_VAR, 'FRONT_VIRTUAL_OFFICE_IMAGE_COMMIT');
  assert.match(tokens.COMPOSE_FILE_DEV, /\/mf-virtual-office\.yml$/);
  assert.match(tokens.COMPOSE_FILE_QA, /\/mf-virtual-office\.yml$/);
  assert.match(tokens.COMPOSE_FILE_PREPROD, /\/mf-virtual-office\.yml$/);
});

test('render records overrides in the regenerate command', () => {
  const file = readConfig().files.find((entry) => entry.id === 'gitlab-ci');
  const output = render(file, 'mf-container', '.', {
    'service-name': 'container',
  });

  assert.match(
    output,
    /^# Regenerate: node scaffold\/generate\.js --service=mf-container --target=\. --service-name=container --force$/m,
  );
  assert.match(output, /^ {2}SERVICE_NAME_DEV: 'container'$/m);
  assert.match(output, /^ {2}SERVICE_NAME_PREPROD: 'container'$/m);
});

test('derive applies explicit overrides for repos that deviate', () => {
  const tokens = derive('mf-container', readConfig().shared, {
    'compose-base-dev': '/srv/docker',
    'service-name': 'container',
  });

  assert.equal(tokens.SERVICE_NAME, 'container');
  assert.equal(tokens.CONTAINER_NAME, 'mf-container');
  assert.equal(tokens.COMPOSE_FILE_DEV, '/srv/docker/mf-container.yml');
});

// The deploy job of an environment, from its name to the next top-level key.
const deployJob = (output, env) =>
  output.split(`\ndeploy:${env}:\n`)[1]?.split(/\n\S/)[0] ?? '';

test('each deploy job targets the service name of its environment', () => {
  const file = readConfig().files.find((entry) => entry.id === 'gitlab-ci');
  const output = render(file, 'mf-core', '.', {
    'service-name': 'core',
    'service-name-dev': 'mf-core',
  });

  assert.match(output, /^ {2}SERVICE_NAME_DEV: 'mf-core'$/m);
  assert.match(output, /^ {2}SERVICE_NAME_QA: 'core'$/m);
  assert.match(output, /^ {2}SERVICE_NAME_PREPROD: 'core'$/m);
  for (const [env, variable] of [
    ['development', 'SERVICE_NAME_DEV'],
    ['quality', 'SERVICE_NAME_QA'],
    ['pre-production', 'SERVICE_NAME_PREPROD'],
  ]) {
    assert.match(
      deployJob(output, env),
      new RegExp(`^ {4}SERVICE_NAME: '\\$${variable}'$`, 'm'),
      `deploy:${env} must use ${variable}`,
    );
  }
  assert.match(
    output,
    /--service-name=core --service-name-dev=mf-core --force$/m,
  );
});

test('without per-environment overrides every environment uses the service name', () => {
  const tokens = derive('mf-core', readConfig().shared, {
    'service-name': 'core',
  });

  assert.equal(tokens.SERVICE_NAME_DEV, 'core');
  assert.equal(tokens.SERVICE_NAME_QA, 'core');
  assert.equal(tokens.SERVICE_NAME_PREPROD, 'core');
});

test('a service without the mf- prefix is accepted with a warning', () => {
  const tokens = derive('template', readConfig().shared);

  assert.equal(tokens.SERVICE_NAME, 'template');
  assert.equal(tokens.CONTAINER_NAME, 'template');
  assert.equal(tokens.COMPOSE_IMAGE_VAR, 'FRONT_TEMPLATE_IMAGE_COMMIT');
  assert.match(tokens.COMPOSE_FILE_DEV, /\/template\.yml$/);
  assert.match(
    serviceWarning('template'),
    /does not start with "mf-"/,
    'the missing prefix must be reported as a warning',
  );
  assert.equal(serviceWarning('mf-template'), null);
});

test('every template token is resolved', () => {
  const file = readConfig().files.find((entry) => entry.id === 'gitlab-ci');
  const tokens = Object.keys(derive('mf-template', readConfig().shared));
  const output = render(file, 'mf-template', '.');

  for (const token of tokens) {
    assert.ok(!output.includes(`{{${token}}}`), `unresolved {{${token}}}`);
  }
});

test('extra env keys become lines of the build_app .env heredoc', () => {
  const file = readConfig().files.find((entry) => entry.id === 'gitlab-ci');
  const output = render(file, 'mf-zoho', '.', {
    'extra-env-keys': 'ZOHO_URL,ZOHO_ORG_ID',
  });

  assert.match(
    output,
    /\n {6}SECRET_KEY=\$SECRET_KEY\n {6}ZOHO_URL=\$ZOHO_URL\n {6}ZOHO_ORG_ID=\$ZOHO_ORG_ID\n {6}EOF\n/,
  );
  assert.match(output, /--extra-env-keys=ZOHO_URL,ZOHO_ORG_ID --force$/m);
});

test('without extra env keys the heredoc keeps only the base variables', () => {
  const file = readConfig().files.find((entry) => entry.id === 'gitlab-ci');
  const output = render(file, 'mf-template', '.');

  assert.match(output, /\n {6}SECRET_KEY=\$SECRET_KEY\n {6}EOF\n/);
  assert.ok(!output.includes('EXTRA_ENV_LINES'));
});

test('derive rejects invalid or duplicated extra env keys', () => {
  const { shared } = readConfig();

  assert.throws(
    () => derive('mf-zoho', shared, { 'extra-env-keys': 'zoho-url' }),
    /invalid extra env key "zoho-url"/,
  );
  assert.throws(
    () => derive('mf-zoho', shared, { 'extra-env-keys': 'API_URL' }),
    /"API_URL" is already written/,
  );
  assert.throws(
    () => derive('mf-zoho', shared, { 'extra-env-keys': 'A_KEY,A_KEY' }),
    /duplicated extra env key "A_KEY"/,
  );
});

test('lint and format:check are advisory and never block build_app', () => {
  const file = readConfig().files.find((entry) => entry.id === 'gitlab-ci');
  const output = render(file, 'mf-template', '.');

  for (const job of ['lint', 'format:check']) {
    const block = output.split(`\n${job}:\n`)[1]?.split(/\n\S/)[0] ?? '';
    assert.match(
      block,
      /^ {2}allow_failure: true$/m,
      `${job} must allow failure`,
    );
  }
  const testUnit = output.split('\ntest:unit:\n')[1]?.split(/\n\S/)[0] ?? '';
  assert.doesNotMatch(
    testUnit,
    /allow_failure: true/,
    'test:unit must stay blocking',
  );
});

test('test:unit installs Chromium only when the repo uses Playwright', () => {
  const file = readConfig().files.find((entry) => entry.id === 'gitlab-ci');
  const testUnit = render(file, 'mf-template', '.')
    .split('\ntest:unit:\n')[1]
    ?.split(/\n\S/)[0];
  assert.ok(testUnit, 'test:unit job not found');

  const install = testUnit.indexOf(
    'if [ -d node_modules/playwright ]; then npx playwright install --with-deps --only-shell chromium; fi',
  );
  assert.notEqual(install, -1, 'missing the conditional Playwright install');
  assert.ok(
    install < testUnit.indexOf('npm run test'),
    'Chromium must be installed before the tests run',
  );
});

test('every script the pipeline runs exists in package.json', () => {
  const file = readConfig().files.find((entry) => entry.id === 'gitlab-ci');
  const output = render(file, 'mf-template', '.');
  const { scripts } = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  );
  const called = [...output.matchAll(/\b(?:npm|bun) run ([\w:-]+)/g)].map(
    (match) => match[1],
  );

  assert.ok(called.length > 0, 'the pipeline runs no package.json script');
  for (const name of called) {
    assert.ok(name in scripts, `the pipeline runs a missing script: ${name}`);
  }
});
