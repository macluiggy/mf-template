#!/usr/bin/env node
/**
 * Module generator: clones `src/app/modules/template` into a new feature module.
 *
 *   bun run generate:module -- --name=<kebab-name>
 *
 * Naming rules applied to file names and contents (see transformContent):
 *   template-x / template.x  -> <kebab>-x / <kebab>.x   (files, selectors, imports)
 *   TEMPLATE_                -> <CONSTANT>_
 *   Template                 -> <Pascal>                (classes, routes)
 *   template (whole word)    -> <kebab>                 (API path)
 * Angular keywords (`templateUrl`, `template:`, `ng-template`, `TemplateRef`)
 * are preserved. Identifiers such as `templateItems` are NOT renamed.
 */

const fs = require('node:fs');
const path = require('node:path');

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const PROTECTED = [/TemplateRef/g, /templateUrl/g, /ng-template/g, /\btemplate(?=\s*:\s*[`'"])/g];

function toCases(name) {
  if (!name || !KEBAB.test(name)) {
    throw new Error(`Invalid module name "${name}": use kebab-case, e.g. --name=user-profile`);
  }
  if (name === 'template') {
    throw new Error('"template" is reserved: it is the source module.');
  }
  const words = name.split('-');
  const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
  return {
    kebab: name,
    pascal: words.map(capitalize).join(''),
    camel: words.map((word, i) => (i === 0 ? word : capitalize(word))).join(''),
    constant: words.join('_').toUpperCase(),
  };
}

function transformFileName(fileName, cases) {
  return fileName.replace(/^template(?=[.-])/, cases.kebab);
}

function transformContent(source, cases) {
  const kept = [];
  let content = source;
  for (const pattern of PROTECTED) {
    content = content.replace(pattern, (match) => {
      kept.push(match);
      return `\u0000${kept.length - 1}\u0000`;
    });
  }

  content = content
    .replace(/TEMPLATE_/g, `${cases.constant}_`)
    .replace(/template(?=[-.])/g, cases.kebab)
    .replace(/Template/g, cases.pascal)
    .replace(/\btemplate\b/g, cases.kebab);

  // biome-ignore lint/suspicious/noControlCharactersInRegex: placeholder delimiter
  return content.replace(/\u0000(\d+)\u0000/g, (_match, index) => kept[Number(index)]);
}

function copyRecursive(source, target, cases) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.name === 'README.md') continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, transformFileName(entry.name, cases));
    if (entry.isDirectory()) {
      copyRecursive(from, to, cases);
    } else {
      fs.writeFileSync(to, transformContent(fs.readFileSync(from, 'utf8'), cases));
    }
  }
}

function generateModule(root, cases) {
  const source = path.join(root, 'src/app/modules/template');
  const target = path.join(root, 'src/app/modules', cases.kebab);
  if (!fs.existsSync(source)) {
    throw new Error(`Template module not found at ${source}`);
  }
  if (fs.existsSync(target)) {
    throw new Error(`Module ${target} already exists.`);
  }
  try {
    copyRecursive(source, target, cases);
  } catch (err) {
    fs.rmSync(target, { recursive: true, force: true });
    throw err;
  }
  return target;
}

function nextSteps(cases) {
  return `
Next steps:
  1. Add the lazy route to src/app/app.routes.ts:
     { path: '${cases.kebab}', loadChildren: () => import('./modules/${cases.kebab}/${cases.kebab}.routes').then((m) => m.${cases.pascal}Routes) },
  2. Adjust the API path in services/ and the types in interfaces/.
  3. Run 'bun run format' (longer names can exceed the line width).`;
}

function main(argv) {
  const nameArg = argv.find((arg) => arg.startsWith('--name='));
  const cases = toCases(nameArg?.slice('--name='.length));
  const root = path.join(__dirname, '..');

  const target = generateModule(root, cases);
  console.info(`✅ Module generated at ${path.relative(root, target)}`);
  console.info(nextSteps(cases));
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

module.exports = { toCases, transformFileName, transformContent, generateModule, nextSteps };
