import { readFileSync, writeFileSync } from 'node:fs';
import { Script } from 'node:vm';
const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const source = readFileSync(new URL('lib/client.js', root), 'utf8');
if (/^\s*import\s/m.test(source)) throw Error('Client builder only supports dependency-free source');
const names = [...source.matchAll(/^export (?:const|function) (\w+)/gm)].map(match => match[1]);
const expected = ['inject', 'BOOT_ASSETS', 'STAGE_CONFIG', 'BOOT_SEGMENTS', 'createBootShow', 'apply'];
if (JSON.stringify(names) !== JSON.stringify(expected)) throw Error('Unexpected client export contract');
const body = source.replace(/^export (?=(?:const|function) )/gm, '');
const bundle = `window.__ModuleLoader__.load({\n  id: ${JSON.stringify(pkg.name)},\n  factory(require) {\n${body}\n    return { ${names.join(', ')} };\n  }\n});\n`;
new Script(bundle);
const output = new URL('lib/client.dsh.js', root);
if (process.argv.includes('--check')) {
    if (readFileSync(output, 'utf8') !== bundle) throw Error('Published client bundle is stale; rebuild before packing');
    console.log('PASS: DSH bundle exactly matches the ESM source');
} else {
    writeFileSync(output, bundle, 'utf8');
    console.log('Built the DSH client factory');
}
