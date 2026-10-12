// Tests for scripts/generate-module.js — run with `bun run test:scripts`
// (node:test, no Angular toolchain involved).

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const {
  toCases,
  transformContent,
  transformFileName,
  generateModule,
  addExpose,
} = require('./generate-module');

const cases = toCases('sample-feature');

test('toCases derives every naming variant from a kebab-case name', () => {
  assert.deepEqual(cases, {
    kebab: 'sample-feature',
    pascal: 'SampleFeature',
    camel: 'sampleFeature',
    constant: 'SAMPLE_FEATURE',
  });
});

test('toCases rejects names that are not kebab-case', () => {
  assert.throws(() => toCases('SampleFeature'), /kebab-case/);
  assert.throws(() => toCases('template'), /reserved/);
  assert.throws(() => toCases(''), /kebab-case/);
});

test('transformFileName renames template files', () => {
  assert.equal(transformFileName('template.service.ts', cases), 'sample-feature.service.ts');
  assert.equal(transformFileName('template-list.page.ts', cases), 'sample-feature-list.page.ts');
  assert.equal(transformFileName('pages', cases), 'pages');
});

test('transformContent renames symbols, paths, selectors and constants', () => {
  const source = [
    "import { TemplateService } from './services/template.service';",
    "selector: 'app-template-table',",
    'export const TEMPLATE_PAGE_SIZE = 10;',
    "RESOURCE = 'template',",
    'export const TemplateRoutes: Routes = [];',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: source code under test
    '`${environment.apiUrl}/${MsPrefixEnum.CORE}/template`',
  ].join('\n');

  assert.equal(
    transformContent(source, cases),
    [
      "import { SampleFeatureService } from './services/sample-feature.service';",
      "selector: 'app-sample-feature-table',",
      'export const SAMPLE_FEATURE_PAGE_SIZE = 10;',
      "RESOURCE = 'sample-feature',",
      'export const SampleFeatureRoutes: Routes = [];',
      // biome-ignore lint/suspicious/noTemplateCurlyInString: expected source code
      '`${environment.apiUrl}/${MsPrefixEnum.CORE}/sample-feature`',
    ].join('\n'),
  );
});

test('transformContent renames a permission string that looks like a key', () => {
  assert.equal(transformContent("toBe('template:listar')", cases), "toBe('sample-feature:listar')");
});

test('transformContent keeps Angular template keywords intact', () => {
  const source =
    "templateUrl: './template-table.component.html', template: '<ng-template />', TemplateRef";
  assert.equal(
    transformContent(source, cases),
    "templateUrl: './sample-feature-table.component.html', template: '<ng-template />', TemplateRef",
  );
});

test('generateModule clones the template module and refuses to overwrite', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-module-'));
  const templateDir = path.join(root, 'src/app/modules/template');
  fs.mkdirSync(path.join(templateDir, 'services'), { recursive: true });
  fs.writeFileSync(path.join(templateDir, 'README.md'), '# docs');
  fs.writeFileSync(
    path.join(templateDir, 'services/template.service.ts'),
    'export class TemplateService {}\n',
  );

  const target = generateModule(root, cases);

  assert.equal(target, path.join(root, 'src/app/modules/sample-feature'));
  assert.equal(
    fs.readFileSync(path.join(target, 'services/sample-feature.service.ts'), 'utf8'),
    'export class SampleFeatureService {}\n',
  );
  assert.equal(fs.existsSync(path.join(target, 'README.md')), false);
  assert.throws(() => generateModule(root, cases), /already exists/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('addExpose registers the routes in federation.config.mjs and tsconfig.federation.json', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-expose-'));
  fs.writeFileSync(
    path.join(root, 'federation.config.mjs'),
    "export default {\n  exposes: {\n    './TemplateRoutes': './src/app/modules/template/template.routes.ts',\n  },\n};\n",
  );
  fs.writeFileSync(
    path.join(root, 'tsconfig.federation.json'),
    JSON.stringify({ files: ['src/app/modules/template/template.routes.ts'] }),
  );

  addExpose(root, cases);
  addExpose(root, cases); // idempotent

  const federation = fs.readFileSync(path.join(root, 'federation.config.mjs'), 'utf8');
  assert.equal(
    federation.split(
      "'./SampleFeatureRoutes': './src/app/modules/sample-feature/sample-feature.routes.ts',",
    ).length,
    2,
  );
  const tsconfig = JSON.parse(fs.readFileSync(path.join(root, 'tsconfig.federation.json'), 'utf8'));
  assert.deepEqual(tsconfig.files, [
    'src/app/modules/template/template.routes.ts',
    'src/app/modules/sample-feature/sample-feature.routes.ts',
  ]);
  fs.rmSync(root, { recursive: true, force: true });
});
