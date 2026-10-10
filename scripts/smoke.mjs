/**
 * Offline contract check for dsh-plugin-boot-whale-maid.
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
const sourceFiles = ['lib/index.js', 'lib/client.js'];
const sources = await Promise.all(sourceFiles.map(f => readFile(join(root, f), 'utf8')));
const importSpecifiers = [...sources.join('\n').matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)]
    .map(m => m[1]);
const unimportedClientPeers = peers.filter(name =>
    !RUNTIME_PROVIDED_PEERS.has(name)
    && !importSpecifiers.some(spec => spec === name || spec.startsWith(`${name}/`)));
check(unimportedClientPeers.length === 0,
    'no client-library peerDependency is declared that the sources never import',
    unimportedClientPeers.length === 0 ? '' : `imported by nothing: ${unimportedClientPeers.join(', ')}`);
check(importSpecifiers.length === 0,
    'both halves are dependency-free (no import statements at all)',
    importSpecifiers.length === 0 ? '' : `imports: ${importSpecifiers.join(', ')}`);

// --- 2) Asset table: the shipped values against the recorded audit -----------
// docs/assets.json is the independent audit of the upstream artworks package
// (hashes read from its source, dimensions parsed from the WebP headers).
// BOOT_ASSETS is what the client actually requests, so the two are compared
// field by field instead of by substring: a wrong hash, a swapped width or a
// silently re-enabled `used` flag fails here rather than at runtime.
const audit = JSON.parse(await readFile(join(root, 'docs/assets.json'), 'utf8'));
const clientModule = await import(new URL(`../${clientEntry}`, import.meta.url).href);
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
const routePattern = new RegExp('^/skin-assets/maid-atelier/[0-9a-f]{64}\\.webp$');
const badUrls = assetKeys.filter(key => !routePattern.test(String(bootAssets[key].url)));
check(badUrls.length === 0,
    'every asset url is a same-origin /skin-assets/maid-atelier/<64-hex>.webp route',
    badUrls.length === 0 ? '' : badUrls.map(k => `${k}=${bootAssets[k].url}`).join(', '));
check(assetKeys.every(key => bootAssets[key].url.includes(bootAssets[key].hash)),
    'each asset url embeds its own hash (no cross-wired entries)');

// --- 3) Timeline and stage geometry, read from the exported values -----------
// The explicit segment table is what the animation is actually played from, so
// its absolute times are pinned: 0.0 / 0.5 / 1.8 / 2.05 / 3.2 / 4.4 / 5.6 / 6.4 s.
const segments = clientModule.BOOT_SEGMENTS;
check(Array.isArray(segments) && segments.length === 8, `BOOT_SEGMENTS has 8 segments (${segments?.length})`);
const expectedAt = [0, 500, 1800, 2050, 3200, 4400, 5600, 6400];
check(JSON.stringify(segments?.map(s => s.at)) === JSON.stringify(expectedAt),
    'segment start times match the documented timeline',
    `at=${JSON.stringify(segments?.map(s => s.at))}`);
check(segments.every(s => typeof s.id === 'string' && s.id !== '' && s.end >= s.at),
    'every segment has a non-empty id and a non-inverted interval');
check(segments[segments.length - 1].end === 6400,
    `the show ends at 6400 ms (${segments[segments.length - 1].end})`);
check(segments[3].at - segments[2].at === 250,
    'the right maid enters exactly 250 ms after the main sprite',
    `delta=${segments[3].at - segments[2].at} ms`);

const stage = clientModule.STAGE_CONFIG;
check(stage.skipFadeMs > 0 && stage.skipFadeMs < 150,
    `skip budget stays under the 150 ms requirement (${stage.skipFadeMs} ms)`);
// 0.96 * 0.5557 + 0.92 * 0.5259 = 1.0173 — the side-by-side width budget.
check(stage.twoMaidWidthFactor === 1.0173 && stage.twoMaidGapPx === 32,
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
check(/setTimeout\([\s\S]*?8000/.test(scriptJs) || scriptJs.includes('8000'),
    'injected script arms an 8000 ms unconditional backstop');
check(scriptJs.trimStart().startsWith('(function(){try{') && scriptJs.includes('catch(error)'),
    'injected script body is wrapped in try/catch (an exception cannot break boot)');

// --- 7) Client half tolerates a service-less context ------------------------
const client = await import(new URL(`../${clientEntry}`, import.meta.url).href);
check(typeof client.apply === 'function', 'client entry exports apply()');
check(Array.isArray(client.inject), 'client entry exports an inject array');
check(JSON.stringify(client.inject) === JSON.stringify(inject),
    'client inject list matches dsh.client.inject in the manifest',
    `entry=${JSON.stringify(client.inject)} manifest=${JSON.stringify(inject)}`);

// No browser here: `ctx.effect` is absent so `apply` returns its no-op handle.
// What matters offline is that mounting in an incomplete runtime is survivable,
// and that the module can be imported in Node at all (no top-level DOM access).
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

// --- 8) Licence consistency across the three declarations -------------------
// The package ships two kinds of content under two licences: CODE under MIT and
// third-party ARTWORK under CC BY-NC-SA 4.0. `package.json` carries one SPDX
// expression for the distribution, `LICENSE` splits the two, and the README
// restates both for humans. A value check, not a presence check: each
// declaration is inspected and then cross-compared, so the three cannot drift
// apart (a bare `CC-BY-NC-SA-4.0` field, which labels code as artwork, fails).
const MIT_SPDX = 'MIT';
const ARTWORK_SPDX = 'CC-BY-NC-SA-4.0';
// Full permission grant and the warranty disclaimer: the substance of MIT,
// not just its name, has to be present for the code licence to mean anything.
const MIT_GRANT = 'Permission is hereby granted, free of charge, to any person obtaining a copy';
const MIT_WARRANTY = 'WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED';

const licenceField = String(pkg.license ?? '');
const licenceText = await readFile(join(root, 'LICENSE'), 'utf8');
const readmeText = await readFile(join(root, 'README.md'), 'utf8');

// The MIT body is checked against a whitespace-collapsed copy of the file: the
// canonical text wraps mid-phrase ("EXPRESS OR\nIMPLIED"), so a raw substring
// test would reject a perfectly valid licence that merely got re-wrapped.
const collapse = (text) => text.replace(/\s+/g, ' ');
const licenceFlat = collapse(licenceText);

check(licenceField !== '', `package.json declares a license field (${licenceField})`);

// SPDX shape: identifiers joined by AND/OR/WITH, optionally parenthesised. A
// bare identifier and an expression are both valid; anything else is a typo.
const SPDX_TOKEN = /^(?:\(|\)|AND|OR|WITH|[A-Za-z0-9.+-]+)$/;
const spdxTokens = licenceField.split(/\s+/).filter(token => token !== '');
check(spdxTokens.length > 0 && spdxTokens.every(token => SPDX_TOKEN.test(token)),
    'the license field is a syntactically well-formed SPDX expression',
    licenceField);

// Case-insensitive match on the identifier itself: SPDX ids are matched
// case-insensitively, so the deprecated `CC-BY-NC-SA-4.0+` form still trips the
// "or later" assertion below while a differently-cased valid id does not.
const hasArtworkId = /cc-by-nc-sa-4\.0/i.test(licenceField);
const hasMitId = /(^|[^a-z0-9.+-])mit([^a-z0-9.+-]|$)/i.test(licenceField);
check(hasArtworkId && hasMitId,
    'the license field declares BOTH the code licence (MIT) and the artwork licence (CC-BY-NC-SA-4.0)',
    licenceField);
check(!spdxTokens.includes('AND') || (hasMitId && hasArtworkId),
    'uses AND only to join the two real licences — each applies to its own content',
    spdxTokens.includes('AND') ? 'AND between MIT and CC-BY-NC-SA-4.0' : 'single identifier');
check(!/CC-BY-NC-SA-4\.0\+/i.test(licenceField),
    'the artwork id is not the deprecated "+" (or-later) form',
    licenceField);

check(licenceFlat.includes(MIT_GRANT) && licenceFlat.includes(MIT_WARRANTY),
    'LICENSE carries the substantive MIT text (grant + warranty disclaimer)');
check(/SOFTWARE \/ CODE — MIT/.test(licenceText) && /ARTWORK — CC BY-NC-SA 4\.0/.test(licenceText),
    'LICENSE keeps the two-layer split: a code/MIT section and an artwork/CC BY-NC-SA 4.0 section');
check(/Applies to:[\s\S]{0,240}?\bMIT\b/.test(licenceText) || /CODE — MIT/.test(licenceText),
    'LICENSE §1 states that the MIT grant covers the code');

// The three declarations must agree: the field names the code licence that
// LICENSE actually grants, and the artwork id that LICENSE §2 actually uses.
check(hasMitId === /MIT/.test(licenceText),
    'the license field and LICENSE agree on whether MIT applies to this package');
check(hasArtworkId === /CC BY-NC-SA 4\.0/.test(licenceText),
    'the license field and LICENSE agree on the artwork licence id');

// README claims. If it asserts MIT for the package code, the LICENSE must back
// it; and naming MIT alone would under-report the artwork terms, so both
// licences have to be declared together.
const readmeClaimsMit = /\bMIT\b/.test(readmeText);
const readmeClaimsArtwork = /CC BY-NC-SA 4\.0/.test(readmeText);
check(readmeClaimsMit, 'README declares the code licence (MIT)');
check(readmeClaimsArtwork, 'README declares the artwork licence (CC BY-NC-SA 4.0)');
check(readmeClaimsMit === licenceText.includes('MIT'),
    'the README MIT claim is backed by the LICENSE text (no claim without an actual grant)');
check(readmeText.includes('LICENSE') && readmeText.includes('docs/ATTRIBUTION.md'),
    'README points readers at both LICENSE and docs/ATTRIBUTION.md');

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
