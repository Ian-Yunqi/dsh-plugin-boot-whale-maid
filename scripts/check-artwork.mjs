import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { serveArtwork, installArtwork, ARTWORK_PREFIX } from '../lib/artwork.js';
import manifest from '../assets/manifest.json' with { type: 'json' };
import { BOOT_ASSETS } from '../lib/client.js';
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
for (const asset of manifest) {
    const bytes = await readFile(new URL('../assets/' + asset.hash + '.png', import.meta.url));
    check(createHash('sha256').update(bytes).digest('hex') === asset.hash, 'asset content matches immutable hash');
    check(bytes.readUInt32BE(16) === asset.width && bytes.readUInt32BE(20) === asset.height, 'manifest records PNG dimensions');
    check(bytes.length === asset.bytes, 'manifest records file length');
}
check(Object.entries(BOOT_ASSETS).every(([role,a]) => role === 'chibi' ? /^\/boot-assets\/whale-maid\/[a-f0-9]{64}\.webp$/.test(a.url) : manifest.some(m => m.hash === a.hash)), 'generated roles map to shipped bitmaps and optional chibi uses the local resolver');
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
check((await request(chibiUrl, 'GET', {}, async()=>{throw Error('not installed');})).status===404, 'missing optional installed skin returns 404');
check((await request(chibiUrl, 'GET', {}, async()=>Buffer.from('wrong image'))).status===404, 'mismatched upstream image bytes are rejected');
check((await request(ARTWORK_PREFIX+'/another.webp')).status===404, 'arbitrary WebP paths are not read');
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
