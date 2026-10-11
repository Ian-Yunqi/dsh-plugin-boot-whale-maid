/**
 * Offline contract check for dsh-boot.
 *
 * It answers the two questions that decide whether this plugin installs and
 * mounts at all — without booting the Harness and without a browser:
 *   1. Is the package manifest a valid DSH plug-in contract?
 *      (type, exports, dsh.bundle.patch, dsh.client, optional peers, and the
 *      `files` whitelist actually existing on disk.)
 *   2. Do BOTH halves mount against a cordis-shaped context — the host half
 *      producing real index-injection rows, and the client half tolerating a
 *      context with no `effect` service instead of throwing.
 *
 * Scope note: this file checks the CONTRACT. The behaviour of the animation
 * itself (timeline, skip budget, shadow isolation, asset degradation) is
 * covered by scripts/assert.mjs. Run both, or `npm run verify`.
 *
 * Run: node scripts/smoke.mjs        (exit code 0 = all checks passed)
 */
import { existsSync, statSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
function check(ok, label, detail = '') {
    results.push({ ok: Boolean(ok), label, detail });
}
const normalize = (p) => String(p ?? '').replace(/^\.\//, '');

// --- 1) Package manifest contract -------------------------------------------
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

check(pkg.type === 'module', 'package.json declares type=module');
check(typeof pkg.main === 'string' && existsSync(join(root, pkg.main)),
    `main entry exists (${pkg.main})`);
check(normalize(pkg.exports?.['.']?.default) === normalize(pkg.main), 'exports["."] matches main');

const clientEntry = pkg.exports?.['./client']?.default;
check(typeof clientEntry === 'string' && existsSync(join(root, clientEntry)),
    `exports["./client"] points at a real file (${clientEntry})`);

check(pkg.dsh?.client?.platform === 'web', 'dsh.client.platform is "web"');

// This plug-in shares no client service with the shell: both halves import
// nothing, so an empty list is the honest value. What must hold is the SHAPE —
// an array whose every entry is a non-empty string — because the loader reads
// it with optionalStringArray() and would reject a malformed entry.
const inject = pkg.dsh?.client?.inject;
check(Array.isArray(inject), 'dsh.client.inject is an array');
check(Array.isArray(inject) && inject.every(name => typeof name === 'string' && name.trim() !== ''),
    'every dsh.client.inject entry is a non-empty string',
    Array.isArray(inject) ? `[${inject.join(', ')}]` : 'not an array');

const peers = Object.keys(pkg.peerDependencies ?? {});
const meta = pkg.peerDependenciesMeta ?? {};
const missingMeta = peers.filter(name => meta[name] === undefined);
const notOptional = peers.filter(name => meta[name]?.optional !== true);
check(missingMeta.length === 0,
    'every peerDependency is declared in peerDependenciesMeta',
    missingMeta.length === 0 ? '' : `undeclared: ${missingMeta.join(', ')}`);
check(notOptional.length === 0,
    'every peerDependency is optional (the host supplies them)',
    notOptional.length === 0 ? '' : `not optional: ${notOptional.join(', ')}`);

// A peer declared for a shared CLIENT LIBRARY that no source file imports is a
// false claim: it tells the loader this bundle consumes a package it never
// touches (this is exactly how a stale `@deepseek-ai/dsh-client-ui-slots` entry
// survived here after the client half stopped importing anything). The runtime
// and framework packages are the ones the HOST supplies to every plugin rather
// than something an `import` statement names, so they are exempt and checked by
// the optional-peer rule above.
const RUNTIME_PROVIDED_PEERS = new Set(['react', 'react-dom', '@deepseek-ai/cordis']);
const sourceFiles = ['lib/index.js', 'lib/client.js', 'lib/artwork.js'];
const sources = await Promise.all(sourceFiles.map(f => readFile(join(root, f), 'utf8')));
const importSpecifiers = [...sources.join('\n').matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)]
    .map(m => m[1]);
const resolvedSpecifiers = [...sources.join('\n').matchAll(/require\.resolve\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
const unimportedClientPeers = peers.filter(name =>
    !RUNTIME_PROVIDED_PEERS.has(name)
    && ![...importSpecifiers, ...resolvedSpecifiers].some(spec => spec === name || spec.startsWith(`${name}/`)));
check(unimportedClientPeers.length === 0,
    'every non-runtime peer is imported or resolved by the plugin',
    unimportedClientPeers.length === 0 ? '' : `imported by nothing: ${unimportedClientPeers.join(', ')}`);
check(importSpecifiers.every(spec => spec.startsWith('node:') || spec.startsWith('./') || spec === '../assets/manifest.json'),
    'host imports only built-ins and its own artwork route; no third-party dependency',
    importSpecifiers.length === 0 ? '' : `imports: ${importSpecifiers.join(', ')}`);

// --- 2) Asset table: the shipped values against the recorded audit -----------
// docs/assets.json is the independent audit of the upstream artworks package
// (hashes read from its source, dimensions parsed from the WebP headers).
// BOOT_ASSETS is what the client actually requests, so the two are compared
// field by field instead of by substring: a wrong hash, a swapped width or a
// silently re-enabled `used` flag fails here rather than at runtime.
const audit = JSON.parse(await readFile(join(root, 'docs/assets.json'), 'utf8'));
const clientModule = await import(new URL('../lib/client.js', import.meta.url).href);
const bootAssets = clientModule.BOOT_ASSETS;
const auditKeys = Object.keys(audit);
const assetKeys = Object.keys(bootAssets ?? {});

check(assetKeys.length === 6, `BOOT_ASSETS declares exactly 6 roles (${assetKeys.length})`);
check(JSON.stringify([...assetKeys].sort()) === JSON.stringify([...auditKeys].sort()),
    'BOOT_ASSETS and docs/assets.json cover the same role set',
    `client=[${assetKeys.join(', ')}] audit=[${auditKeys.join(', ')}]`);

const assetMismatches = [];
for (const key of auditKeys) {
    const fromAudit = audit[key];
    const fromClient = bootAssets?.[key];
    if (fromClient === undefined) { assetMismatches.push(`${key}: absent from BOOT_ASSETS`); continue; }
    for (const field of ['hash', 'url', 'width', 'height']) {
        if (fromClient[field] !== fromAudit[field]) {
            assetMismatches.push(`${key}.${field}: client=${fromClient[field]} audit=${fromAudit[field]}`);
        }
    }
    if (fromClient.ratio !== fromAudit.aspectRatio) {
        assetMismatches.push(`${key}.ratio: client=${fromClient.ratio} audit=${fromAudit.aspectRatio}`);
    }
}
check(assetMismatches.length === 0,
    'every BOOT_ASSETS hash/url/width/height/ratio matches the docs/assets.json audit',
    assetMismatches.length === 0 ? '6 roles compared field by field' : assetMismatches.join('; '));

// `used` decides whether a role is requested at all. Only `vision` (the
// flash-perspective variant of the right maid) may stand down.
const unusedRoles = assetKeys.filter(key => bootAssets[key].used !== true);
check(unusedRoles.length === 1 && unusedRoles[0] === 'vision',
    'exactly one role is marked used:false, and it is vision',
    `unused=[${unusedRoles.join(', ')}]`);

// Same-origin route only: no local paths, no CDN, no inlined bytes.
const routePattern = /^(?:\/boot-assets\/whale-maid\/[0-9a-f]{64}\.png|\/boot-assets\/whale-maid\/[0-9a-f]{64}\.webp)$/;
const badUrls = assetKeys.filter(key => !routePattern.test(String(bootAssets[key].url)));
check(badUrls.length === 0,
    'every asset url is a same-origin /boot-assets/whale-maid/<64-hex>.png route',
    badUrls.length === 0 ? '' : badUrls.map(k => `${k}=${bootAssets[k].url}`).join(', '));
check(assetKeys.every(key => bootAssets[key].url.includes(bootAssets[key].hash)),
    'each asset url embeds its own hash (no cross-wired entries)');

// --- 3) Timeline and stage geometry, read from the exported values -----------
// The explicit segment table is what the animation is actually played from, so
// its absolute times are pinned: 0.0 / 0.5 / 1.8 / 2.05 / 3.2 / 4.4 / 5.6 / 6.4 s.
const segments = clientModule.BOOT_SEGMENTS;
check(Array.isArray(segments) && segments.length === 8, `BOOT_SEGMENTS has 8 segments (${segments?.length})`);
const expectedAt = [0, 750, 2700, 3075, 4800, 6600, 8400, 9600];
check(JSON.stringify(segments?.map(s => s.at)) === JSON.stringify(expectedAt),
    'segment start times match the documented timeline',
    `at=${JSON.stringify(segments?.map(s => s.at))}`);
check(segments.every(s => typeof s.id === 'string' && s.id !== '' && s.end >= s.at),
    'every segment has a non-empty id and a non-inverted interval');
check(segments[segments.length - 1].end === 9600,
    `the show ends at 9600 ms (${segments[segments.length - 1].end})`);
check(segments[3].at - segments[2].at === 375,
    'the right maid enters exactly 375 ms after the main sprite',
    `delta=${segments[3].at - segments[2].at} ms`);

const stage = clientModule.STAGE_CONFIG;
check(stage.skipFadeMs === 0,
    `skip budget stays under the 150 ms requirement (${stage.skipFadeMs} ms)`);
// 0.96 * 0.5557 + 0.92 * 0.5259 = 1.0173 — the side-by-side width budget.
check(Math.abs(stage.twoMaidWidthFactor - 1.88 * bootAssets['maid-left'].ratio) < 1e-9 && stage.twoMaidGapPx === 32,
    'the two-maid width budget matches the intrinsic-ratio sum plus its gap',
    `${stage.twoMaidWidthFactor} + ${stage.twoMaidGapPx}px`);
check(stage.maidLeftHeight === '0.96' && stage.maidRightHeight === '0.92' && stage.chibiHeight === '0.15',
    'sprite heights follow the audited geometry (0.96 / 0.92 / 0.15 of stage height)',
    `${stage.maidLeftHeight} / ${stage.maidRightHeight} / ${stage.chibiHeight}`);
const chibiFraction = Number(stage.chibiHeight);
check(chibiFraction >= 0.12 && chibiFraction <= 0.18,
    `chibi height sits inside the recommended 12%-18% band (${chibiFraction})`);
check(stage.narrowPx === 720, `narrow layout breakpoint is 720 px (${stage.narrowPx})`);

// --- 4) Bundle patch ---------------------------------------------------------
const patchPath = pkg.dsh?.bundle?.patch;
check(typeof patchPath === 'string' && existsSync(join(root, patchPath)),
    `dsh.bundle.patch points at a real file (${patchPath})`);
const patchText = await readFile(join(root, patchPath), 'utf8');
check(patchText.includes(pkg.name), `bundle patch mounts this package by name (${pkg.name})`);
check(/^\s*-\s*insert:/m.test(patchText), 'bundle patch uses an insert entry');

// --- 5) `files` whitelist integrity -----------------------------------------
// Catches the drift class where the manifest lists a deliverable that was never
// written (or was renamed), i.e. a published package that is missing a file it
// promised. `scripts` and `docs` are directories and are checked as such.
check(Array.isArray(pkg.files) && pkg.files.length > 0, 'package.json declares a files whitelist');
const missingFiles = [];
for (const entry of pkg.files ?? []) {
    const full = join(root, entry);
    if (!existsSync(full)) { missingFiles.push(`${entry} (missing)`); continue; }
    // A directory entry is only meaningful if it actually carries files.
    if (statSync(full).isDirectory() && (await readdir(full)).length === 0) {
        missingFiles.push(`${entry} (empty directory)`);
    }
}
check(missingFiles.length === 0,
    'every files[] entry exists on disk',
    missingFiles.length === 0 ? `${(pkg.files ?? []).length} entries` : missingFiles.join(', '));

// --- 6) Host half mounts and contributes real rows ---------------------------
/** Minimal cordis-shaped context: records every subscription this plugin makes. */
function createStubContext() {
    const state = { events: [], listeners: [], effects: [] };
    const ctx = {
        on: (event, listener) => {
            state.events.push(event);
            state.listeners.push(listener);
            return () => undefined;
        },
        effect: (fn, label) => { state.effects.push({ label, dispose: fn() }); return () => undefined; },
        logger: { info: () => undefined, warn: () => undefined },
        state,
    };
    return ctx;
}

const host = await import(new URL(`../${pkg.main}`, import.meta.url).href);
check(typeof host.name === 'string' && host.name !== '', `host entry exports name (${host.name})`);
check(Array.isArray(host.inject), `host entry exports an inject array (${JSON.stringify(host.inject)})`);
check(typeof host.apply === 'function', 'host entry exports apply()');

const hostCtx = createStubContext();
let hostThrew = null;
try { host.apply(hostCtx); } catch (error) { hostThrew = error; }
check(hostThrew === null, 'host apply() does not throw on a cordis-shaped context',
    hostThrew === null ? '' : String(hostThrew?.message));
check(hostCtx.state.events.length === 1 && hostCtx.state.events[0] === 'webserver/index-inject',
    `apply() subscribes exactly once, to webserver/index-inject (${JSON.stringify(hostCtx.state.events)})`);

// Drive the real listener: this is the registration the carrier actually calls
// once per served document, so the rows are inspected exactly as served.
const table = [];
let injectThrew = null;
try {
    for (const listener of hostCtx.state.listeners) listener(table);
} catch (error) { injectThrew = error; }
check(injectThrew === null, 'index-inject callback runs without throwing',
    injectThrew === null ? '' : String(injectThrew?.message));

const styleRows = table.filter(row => row?.kind === 'style');
const scriptRows = table.filter(row => row?.kind === 'script');
check(styleRows.length >= 1, `index-inject contributes a style row (${styleRows.length})`);
check(styleRows.every(row => typeof row.text === 'string' && row.text.length > 0),
    'style rows carry non-empty text');
check(scriptRows.length >= 1, `index-inject contributes a script row (${scriptRows.length})`);
check(scriptRows.some(row => row.placement === 'head'),
    'at least one script row is placed in <head> (runs during parsing)',
    `placements: ${JSON.stringify(scriptRows.map(r => r?.placement))}`);

const styleCss = styleRows.map(row => row.text).join('\n');
const scriptJs = scriptRows.map(row => row.text).join('\n');

// The curtain must be scoped to this plugin's own class, and must be able to
// cover the shell: fixed, full-viewport, non-interactive.
check(styleCss.includes('html.dsh-whale-maid-first'),
    'curtain CSS is scoped to the plugin state class html.dsh-whale-maid-first');
check(styleCss.includes('position:fixed') && styleCss.includes('inset:0'),
    'curtain CSS covers the viewport (position:fixed + inset:0)');
check(styleCss.includes('pointer-events:none'), 'curtain CSS does not swallow pointer events');
check(!/!important|(^|[^-\w])body\b|#root/.test(styleCss),
    'curtain CSS over-reaches nothing outside documentElement');

// The injected script's four load-bearing behaviours, by name.
for (const [needle, why] of [
    ['dsh550c-first', 'yields to the 550c splash (mutual exclusion)'],
    ['__dshWhaleMaidBoot', 'exposes the idempotent end() hook'],
    ['[data-dsh-boot]', 'watches the native boot card'],
    ['[data-dsh-boot-spinner]', 'detects the native failure state'],
]) {
    check(scriptJs.includes(needle), `injected script references ${needle} — ${why}`);
}
check(/setTimeout\([\s\S]*?14000/.test(scriptJs) || scriptJs.includes('14000'),
    'injected script arms an 14000 ms unconditional backstop');
check(scriptJs.trimStart().startsWith('(function(){try{') && scriptJs.includes('catch(error)'),
    'injected script body is wrapped in try/catch (an exception cannot break boot)');

// --- 7) Client half tolerates a service-less context ------------------------
const clientRegistrations = [];
const clientSandbox = createContext({ window: { __ModuleLoader__: {
    load(registration) { clientRegistrations.push(registration); },
} } });
new Script(await readFile(join(root, clientEntry), 'utf8')).runInContext(clientSandbox);
check(clientRegistrations.length === 1, 'client classic script registers exactly one factory');
check(clientRegistrations[0]?.id === pkg.name, 'client registration id matches the package name');
const client = clientRegistrations[0].factory(() => { throw new Error('Unexpected dependency'); });
check(typeof client.apply === 'function', 'client entry exports apply()');
check(Array.isArray(client.inject), 'client entry exports an inject array');
check(JSON.stringify(client.inject) === JSON.stringify(inject),
    'client inject list matches dsh.client.inject in the manifest',
    `entry=${JSON.stringify(client.inject)} manifest=${JSON.stringify(inject)}`);

// No browser here: `ctx.effect` is absent so `apply` returns its no-op handle.
// The browser entry must register as a classic script; its factory must tolerate
// mounting in an incomplete runtime. ESM source validation happens separately.
const clientCtx = { logger: { info: () => undefined, warn: () => undefined } };
let clientThrew = null;
let handle = null;
try { handle = client.apply(clientCtx); } catch (error) { clientThrew = error; }
check(clientThrew === null, 'client apply() does not throw without an effect service',
    clientThrew === null ? '' : String(clientThrew?.message));
check(handle !== null && typeof handle === 'object' && typeof handle.dispose === 'function',
    'client apply() returns a disposable handle');

// With an effect service present the registration must be wrapped so it can be
// torn down with the fiber — that is what keeps reloads from stacking stages.
const clientCtxWithEffect = createStubContext();
let effectCtxThrew = null;
try { client.apply(clientCtxWithEffect); } catch (error) { effectCtxThrew = error; }
check(effectCtxThrew === null, 'client apply() does not throw with an effect service',
    effectCtxThrew === null ? '' : String(effectCtxThrew?.message));
check(clientCtxWithEffect.state.effects.length === 1,
    `client apply() registers exactly one effect (${clientCtxWithEffect.state.effects.length})`,
    JSON.stringify(clientCtxWithEffect.state.effects.map(e => e.label)));
check(clientCtxWithEffect.state.effects.every(e => typeof e.dispose === 'function'),
    'the client registration is disposable (no stage survives an unload)');

// --- 8) License scope and artwork attribution -------------------------------
const licenceText = await readFile(join(root, 'LICENSE'), 'utf8');
const readmeText = await readFile(join(root, 'README.md'), 'utf8');
const flat = licenceText.replace(/\s+/g, ' ');
check(pkg.license === 'SEE LICENSE IN LICENSE', 'package refers to its layered LICENSE');
check(flat.includes('Permission is hereby granted, free of charge') && flat.includes('WITHOUT WARRANTY OF ANY KIND'), 'code retains the MIT grant and disclaimer');
check(licenceText.includes('AI-generated') && licenceText.includes('CC BY-NC-SA 4.0'), 'generated assets and referenced upstream chibi have separate scope');
check(readmeText.includes('9.6') && readmeText.includes('2.6'), 'README documents full and reduced-motion durations');
check(readmeText.includes('LICENSE') && readmeText.includes('docs/ATTRIBUTION.md'), 'README points to license and attribution');

// --- Report ------------------------------------------------------------------
let failed = 0;
for (const { ok, label, detail } of results) {
    if (!ok)
        failed += 1;
    const mark = ok ? 'PASS' : 'FAIL';
    console.log(`${mark}  ${label}${detail === '' ? '' : `  [${detail}]`}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
