// Every relative markdown link of the docs must resolve (file AND anchor):
// a broken link in AGENTS.md is a broken rule for whoever follows it.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.join(__dirname, '..');

const DOCS = [
  'AGENTS.md',
  'README.md',
  '.agents/architecture.md',
  '.agents/capabilities.local.md',
  '.agents/deployment.md',
  '.agents/environment.md',
  '.agents/host-integration.md',
  '.agents/merge-changes-from-front-template.md',
  '.agents/projects-from-template.md',
  '.agents/testing.md',
  '.agents/skills/merge-fork-from-front-template/SKILL.md',
  '.agents/skills/merge-fork-from-front-template/references/native-federation-contract.md',
  '.agents/skills/merge-fork-from-front-template/references/post-merge-fixups.md',
  '.agents/skills/merge-fork-from-front-template/references/version-alignment.md',
  '.agents/skills/merge-fork-from-front-template/references/vitest-migration.md',
  'scaffold/README.md',
  'src/app/integrations/neocore/README.md',
  'src/app/modules/template/README.md',
];

// GitHub anchor of a heading: lowercase, no punctuation, spaces to dashes.
const slug = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');

const anchorsOf = (file) =>
  new Set(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line) => {
        const match = /^(#{1,6})\s+(.*)$/.exec(line);
        return match ? [slug(match[2])] : [];
      }),
  );

const linksOf = (file) =>
  [...fs.readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)].map(
    (match) => match[1],
  );

test('every relative documentation link resolves (file and anchor)', () => {
  const problems = [];

  for (const doc of DOCS) {
    const file = path.join(root, doc);
    assert.ok(fs.existsSync(file), `missing doc: ${doc}`);

    for (const link of linksOf(file)) {
      if (/^(https?:|mailto:|#)/.test(link)) continue;
      const [target, anchor] = link.split('#');
      const resolved = path.resolve(path.dirname(file), target);
      if (!fs.existsSync(resolved)) {
        problems.push(`${doc}: target not found -> ${link}`);
        continue;
      }
      if (anchor && !anchorsOf(resolved).has(anchor)) {
        problems.push(`${doc}: anchor not found -> ${link}`);
      }
    }
  }

  assert.deepEqual(problems, [], problems.join('\n'));
});
