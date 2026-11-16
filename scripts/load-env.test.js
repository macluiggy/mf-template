// `bun run test` must not depend on the developer's `.env`: with `--example`,
// load-env reads only `.env.example` (process variables, e.g. CI, still win).
const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const root = path.join(__dirname, '..');

// Variables the tests own: the developer's shell must not leak into them.
const MANAGED_VARS = [
  'API_URL',
  'ENTITY_ROOT',
  'ENV_FETCH_TIMEOUT_MS',
  'ENV_REMOTE_URL',
  'NODE_ENV',
  'SECRET_KEY',
  'SKIP_ENV_FETCH',
];

function sandbox(envContent) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'load-env-'));
  fs.copyFileSync(
    path.join(root, 'load-env.js'),
    path.join(dir, 'load-env.js'),
  );
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.copyFileSync(
    path.join(root, 'scripts/env-helper.js'),
    path.join(dir, 'scripts/env-helper.js'),
  );
  fs.copyFileSync(
    path.join(root, '.env.example'),
    path.join(dir, '.env.example'),
  );
  fs.symlinkSync(
    path.join(root, 'node_modules'),
    path.join(dir, 'node_modules'),
  );
  if (envContent !== undefined)
    fs.writeFileSync(path.join(dir, '.env'), envContent);
  return dir;
}

function buildEnv(extraEnv = {}) {
  const env = { ...process.env, ...extraEnv };
  for (const key of MANAGED_VARS) {
    if (!(key in extraEnv)) delete env[key];
  }
  return env;
}

// Async spawn on purpose: `spawnSync` would block the event loop of this
// process and the local HTTP server below could never answer the request.
function runResult(dir, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['load-env.js', ...args], {
      cwd: dir,
      env: buildEnv(extraEnv),
    });
    let stderr = '';
    let stdout = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, stderr, stdout });
    });
  });
}

async function run(dir, args, extraEnv = {}) {
  const result = await runResult(dir, args, extraEnv);
  assert.equal(result.code, 0, `load-env failed: ${result.stderr}`);
  return fs.readFileSync(
    path.join(dir, 'src/environments/environment.ts'),
    'utf8',
  );
}

function runInterface(dir) {
  return fs.readFileSync(
    path.join(dir, 'src/environments/environment.interface.ts'),
    'utf8',
  );
}

/**
 * Local endpoint standing in for a remote env document.
 * @param {(req: http.IncomingMessage, res: http.ServerResponse) => void} handler
 * @returns {Promise<{ close: () => Promise<void>, requests: () => number, url: string }>}
 */
function startServer(handler) {
  let requests = 0;
  const server = http.createServer((req, res) => {
    requests += 1;
    handler(req, res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        close: () =>
          new Promise((done) => {
            server.close(done);
          }),
        requests: () => requests,
        url: `http://127.0.0.1:${port}/ms-core/parameter/env`,
      });
    });
  });
}

function jsonHandler(payload) {
  return (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  };
}

const exampleApiUrl = () =>
  fs
    .readFileSync(path.join(root, '.env.example'), 'utf8')
    .match(/^API_URL=(.*)$/m)[1]
    .trim();

test('--example ignores .env and reads .env.example', async () => {
  const dir = sandbox('API_URL=http://from-dot-env.invalid\n');
  try {
    const output = await run(dir, ['--example']);
    assert.match(output, new RegExp(exampleApiUrl().replaceAll('.', '\\.')));
    assert.doesNotMatch(output, /from-dot-env/);
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('--example works when .env exists but is empty', async () => {
  const dir = sandbox('');
  try {
    assert.match(await run(dir, ['--example']), /apiUrl/);
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('process variables still win over .env.example', async () => {
  const dir = sandbox();
  try {
    const output = await run(dir, ['--example'], {
      API_URL: 'http://from-process.invalid',
    });
    assert.match(output, /from-process\.invalid/);
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('without --example, .env is used as before', async () => {
  const dir = sandbox(
    fs
      .readFileSync(path.join(root, '.env.example'), 'utf8')
      .replace(/^API_URL=.*$/m, 'API_URL=http://from-dot-env.invalid'),
  );
  try {
    assert.match(await run(dir, []), /from-dot-env\.invalid/);
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('only API_URL is required: the NEOCORE preset is optional', async () => {
  const dir = sandbox('API_URL=http://only-api-url.invalid\n');
  try {
    const output = await run(dir, []);
    assert.match(output, /apiUrl: "http:\/\/only-api-url\.invalid"/);
    assert.doesNotMatch(output, /secretKey/);
    assert.doesNotMatch(output, /entityRoot/);
    // The type stays stable: both are optional properties.
    const interfaceContent = runInterface(dir);
    assert.match(interfaceContent, /secretKey\?: string;/);
    assert.match(interfaceContent, /entityRoot\?: string;/);
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('a missing API_URL fails the generation', async () => {
  const dir = sandbox('SECRET_KEY=change-me-use-the-host-secret\n');
  try {
    const result = await runResult(dir, []);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /API_URL/);
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('SECRET_KEY is only validated when it is set', async () => {
  const dir = sandbox('API_URL=http://only-api-url.invalid\n');
  try {
    const result = await runResult(dir, []);
    assert.equal(result.code, 0);
    assert.doesNotMatch(result.stderr, /SECRET_KEY/);
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('a short SECRET_KEY fails with a clear message', async () => {
  const dir = sandbox(
    'API_URL=http://only-api-url.invalid\nSECRET_KEY=too-short\n',
  );
  try {
    const result = await runResult(dir, []);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SECRET_KEY must have at least 10 characters/);
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('the NEOCORE preset writes SECRET_KEY and ENTITY_ROOT', async () => {
  const dir = sandbox(
    'API_URL=http://only-api-url.invalid\nSECRET_KEY=change-me-use-the-host-secret\nENTITY_ROOT=ROOT\n',
  );
  try {
    const output = await run(dir, []);
    assert.match(output, /secretKey: "change-me-use-the-host-secret"/);
    assert.match(output, /entityRoot: "ROOT"/);
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('no remote fetch happens without ENV_REMOTE_URL', async () => {
  const server = await startServer(jsonHandler({ data: { remoteFlag: 'on' } }));
  const dir = sandbox(`API_URL=${server.url}\n`);
  try {
    const output = await run(dir, []);
    assert.equal(server.requests(), 0);
    assert.doesNotMatch(output, /remoteFlag/);
  } finally {
    await server.close();
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('the remote config is fetched when ENV_REMOTE_URL is set', async () => {
  const server = await startServer(jsonHandler({ data: { remoteFlag: 'on' } }));
  const dir = sandbox('API_URL=http://only-api-url.invalid\n');
  try {
    const output = await run(dir, [], { ENV_REMOTE_URL: server.url });
    assert.equal(server.requests(), 1);
    assert.match(output, /remoteFlag: "on"/);
    assert.match(runInterface(dir), /remoteFlag\?: string;/);
  } finally {
    await server.close();
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('SKIP_ENV_FETCH wins over ENV_REMOTE_URL', async () => {
  const server = await startServer(jsonHandler({ data: { remoteFlag: 'on' } }));
  const dir = sandbox('API_URL=http://only-api-url.invalid\n');
  try {
    const output = await run(dir, [], {
      ENV_REMOTE_URL: server.url,
      SKIP_ENV_FETCH: '1',
    });
    assert.equal(server.requests(), 0);
    assert.doesNotMatch(output, /remoteFlag/);
  } finally {
    await server.close();
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('a failing remote fetch warns and keeps the .env values', async () => {
  const server = await startServer((_req, res) => {
    res.writeHead(500);
    res.end('nope');
  });
  const dir = sandbox('API_URL=http://only-api-url.invalid\n');
  try {
    const result = await runResult(dir, [], { ENV_REMOTE_URL: server.url });
    assert.equal(result.code, 0);
    assert.match(result.stderr, /Could not fetch/);
    assert.match(result.stdout, /API_URL/);
  } finally {
    await server.close();
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

test('runs on a Node without native Temporal (falls back to the polyfill)', () => {
  const dir = sandbox();
  try {
    // Simulates Node < 26, which has no global Temporal.
    const strip = path.join(dir, 'strip-temporal.js');
    fs.writeFileSync(strip, 'delete globalThis.Temporal;\n');
    const env = buildEnv();
    execFileSync(
      process.execPath,
      ['--require', strip, 'load-env.js', '--example'],
      { cwd: dir, env, stdio: 'pipe' },
    );
    const output = fs.readFileSync(
      path.join(dir, 'src/environments/environment.ts'),
      'utf8',
    );
    assert.match(output, /Generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
  } finally {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});
