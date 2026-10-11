import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { serveArtwork, installArtwork, ARTWORK_PREFIX } from '../lib/artwork.js';
import manifest from '../assets/manifest.json' with { type: 'json' };
import { BOOT_ASSETS } from '../lib/client.js';
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
for (const asset of manifest) {
    const file = asset.url.split('/').pop();
    const bytes = await readFile(new URL('../assets/' + file, import.meta.url));
    check(createHash('sha256').update(bytes).digest('hex') === asset.hash, 'asset content matches immutable hash');
    if (file.endsWith('.webp')) {
        check(bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
            && bytes.toString('ascii', 12, 16) === 'VP8X' && bytes.readUInt32LE(4) === bytes.length - 8,
            'bundled chibi is a complete extended WebP');
        check(bytes.readUIntLE(24, 3) + 1 === asset.width && bytes.readUIntLE(27, 3) + 1 === asset.height,
            'manifest records WebP dimensions');
    } else {
        check(bytes.readUInt32BE(16) === asset.width && bytes.readUInt32BE(20) === asset.height, 'manifest records PNG dimensions');
    }
    check(bytes.length === asset.bytes, 'manifest records file length');
}
check(Object.values(BOOT_ASSETS).every(a => manifest.some(m => m.hash === a.hash && m.url === a.url)),
    'every client role, including the chibi, maps to a shipped bitmap');
async function request(url, method='GET', headers={}, readChibi) {
    const res = { status: 0, headers: {}, body: undefined,
        writeHead(status, fields) { this.status=status; this.headers=fields ?? {}; return this; },
        end(body) { this.body=body; return this; } };
    await serveArtwork({url, method, headers}, res, readChibi);
    return res;
}
const url = ARTWORK_PREFIX + '/' + manifest[0].hash + '.png';
const get = await request(url);
check(get.status === 200 && get.body.length === manifest[0].bytes, 'GET returns complete bytes');
check(get.headers['Content-Type'] === 'image/png', 'PNG MIME type is explicit');
check(get.headers['X-Content-Type-Options'] === 'nosniff', 'MIME sniffing disabled');
const head = await request(url, 'HEAD');
check(head.status === 200 && head.body === undefined && head.headers['Content-Length'] === get.body.length, 'HEAD omits body');
check((await request(url, 'GET', {'if-none-match':get.headers.ETag})).status === 304, 'ETag supports conditional requests');
check((await request(url, 'POST')).status === 405, 'unsupported method rejected');
for (const pathname of ['/boot-assets/whale-maid/../package.json','/boot-assets/whale-maid/%2e%2e%2fpackage.json',ARTWORK_PREFIX+'/not-allowed.png',ARTWORK_PREFIX+'/'.repeat(2)+manifest[0].hash+'.png']) {
    check((await request(pathname)).status === 404, 'unlisted or traversal path rejected: ' + pathname);
}
const chibiUrl = ARTWORK_PREFIX + '/' + BOOT_ASSETS.chibi.hash + '.webp';
const chibi = await request(chibiUrl);
check(chibi.status === 200 && chibi.body.length === BOOT_ASSETS.chibi.bytes, 'chibi GET succeeds without any installed skin or injected reader');
check(createHash('sha256').update(chibi.body).digest('hex') === BOOT_ASSETS.chibi.hash, 'chibi GET returns the exact upstream bytes');
check(chibi.headers['Content-Type'] === 'image/webp' && chibi.headers['X-Content-Type-Options'] === 'nosniff', 'WebP MIME type is explicit');
const chibiHead = await request(chibiUrl, 'HEAD');
check(chibiHead.status === 200 && chibiHead.body === undefined && chibiHead.headers['Content-Length'] === chibi.body.length, 'chibi HEAD omits the body and preserves its length');
check((await request(chibiUrl, 'GET', {'if-none-match':chibi.headers.ETag})).status === 304, 'chibi ETag supports conditional requests');
check((await request(chibiUrl, 'GET', {}, async()=>{throw Error('missing packaged file');})).status===404, 'missing packaged chibi returns 404');
check((await request(chibiUrl, 'GET', {}, async()=>Buffer.from('wrong image'))).status===404, 'mismatched upstream image bytes are rejected');
check((await request(ARTWORK_PREFIX+'/another.webp')).status===404, 'arbitrary WebP paths are not read');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
check(!pkg.peerDependencies?.['@smalltailqwq/dsh-client-ui-skin-maid-atelier'], 'original skin is no longer a peer dependency');
check(pkg.files.includes('LICENSE-ARTWORK') && pkg.files.includes('docs/UPSTREAM-NOTICE'), 'release includes upstream artwork licence and attribution');
check((await readFile(new URL('../LICENSE-ARTWORK', import.meta.url), 'utf8')).includes('Attribution-NonCommercial-ShareAlike 4.0'), 'artwork licence text is included');
const notice = await readFile(new URL('../docs/UPSTREAM-NOTICE', import.meta.url), 'utf8');
check(['上善', 'ZipZipPipe', 'Small-tailqwq'].every(author => notice.includes(author)), 'complete upstream attribution chain is included');
let row, released=false, registeredScope;
installArtwork({ inject(names, callback) {
    registeredScope=names;
    callback({ get: () => ({register(value) { row=value; return () => { released=true; }; }}),
        effect(factory) { const dispose=factory(); dispose(); } });
} });
check(registeredScope.length === 1 && registeredScope[0] === 'webServer', 'registration waits for webServer');
check(row.path === ARTWORK_PREFIX && row.kind === 'prefix' && row.handler === serveArtwork, 'registered route uses tested handler');
check(released, 'effect lifecycle unregisters the route');
console.log('PASS: ' + checks + ' artwork, path boundary and lifecycle checks');
