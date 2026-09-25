import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.dirname(fileURLToPath(import.meta.url));
const targetRoot = process.cwd();

if (!existsSync(path.join(targetRoot, 'package.json'))) {
  console.error('Nie znaleziono package.json. Uruchom instalator w katalogu głównym projektu Octopus.');
  process.exit(1);
}

const files = [
  ['scripts/test-ui-server.mjs', 'scripts/test-ui-server.mjs'],
  ['test-ui/index.html', 'test-ui/index.html'],
  ['test-ui/app.js', 'test-ui/app.js'],
  ['test-ui/styles.css', 'test-ui/styles.css'],
  ['TEST-UI.md', 'TEST-UI.md'],
];

for (const [source, target] of files) {
  const sourcePath = path.join(sourceRoot, source);
  const targetPath = path.join(targetRoot, target);
  await mkdir(path.dirname(targetPath), { recursive: true });
  if (path.resolve(sourcePath) !== path.resolve(targetPath)) {
    await copyFile(sourcePath, targetPath);
    console.log(`Skopiowano: ${target}`);
  } else {
    console.log(`Plik już jest na miejscu: ${target}`);
  }
}

const packagePath = path.join(targetRoot, 'package.json');
const raw = await readFile(packagePath, 'utf8');
const pkg = JSON.parse(raw);
pkg.scripts ||= {};
pkg.scripts['test-ui'] = 'node scripts/test-ui-server.mjs';
await writeFile(`${packagePath}.before-test-ui`, raw, 'utf8');
await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

console.log('');
console.log('Gotowe. Dodano skrypt npm:');
console.log('  npm run test-ui');
console.log('');
console.log('Backup package.json: package.json.before-test-ui');
