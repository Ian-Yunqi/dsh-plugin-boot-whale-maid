import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import manifest from '../assets/manifest.json' with { type: 'json' };

export const ARTWORK_PREFIX = '/boot-assets/whale-maid';
const directory = new URL('../assets/', import.meta.url);
const allowed = new Set(manifest.map(asset => asset.hash + '.png'));
const chibiHash = '405917afdb68d725624bbf7e4f1619a35fc4004039b7d553c5528ca5f65308d3';
const chibiFile = chibiHash + '.webp';
const require = createRequire(import.meta.url);

async function readInstalledChibi() {
    const packageFile = require.resolve('@smalltailqwq/dsh-client-ui-skin-maid-atelier/package.json');
    return readFile(new URL('./assets/runtime/' + chibiFile, pathToFileURL(packageFile)));
}

// Only packaged immutable artwork is served. User-controlled paths are never read.
export async function serveArtwork(req, res, readChibi = readInstalledChibi) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' }).end();
        return;
    }
    let pathname;
    try { pathname = new URL(req.url ?? '/', 'http://localhost').pathname; }
    catch { res.writeHead(400).end(); return; }
    const file = pathname.slice(ARTWORK_PREFIX.length + 1);
    if (!pathname.startsWith(ARTWORK_PREFIX + '/') || (!allowed.has(file) && file !== chibiFile)) {
        res.writeHead(404).end();
        return;
    }
    const etag = '"' + file.slice(0, 64) + '"';
    const headers = {
        'Content-Type': file === chibiFile ? 'image/webp' : 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        ETag: etag,
    };
    if (req.headers?.['if-none-match']?.split(',').some(value => value.trim() === etag || value.trim() === '*')) {
        res.writeHead(304, headers).end();
        return;
    }
    let bytes;
    try {
        bytes = file === chibiFile ? await readChibi() : await readFile(new URL(file, directory));
        if (file === chibiFile && createHash('sha256').update(bytes).digest('hex') !== chibiHash) throw Error('Unexpected chibi bytes');
    }
    catch { res.writeHead(404).end(); return; }
    res.writeHead(200, { ...headers, 'Content-Length': bytes.length });
    res.end(req.method === 'HEAD' ? undefined : bytes);
}

export function installArtwork(ctx) {
    ctx.inject(['webServer'], webCtx => {
        const server = webCtx.get('webServer');
        webCtx.effect(() => server.register({ kind: 'prefix', path: ARTWORK_PREFIX, handler: serveArtwork }),
            'whale-maid: packaged presentation assets');
    });
}
