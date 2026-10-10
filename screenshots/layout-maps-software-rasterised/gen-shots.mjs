/**
 * Self-contained generator for the four docs/shots PNGs of t18.
 *
 * Pure Node: hand-written PNG encoder (zlib) + 2D painter. No browser, no
 * dependency, no network. Geometry comes from the frozen lib/client.js
 * formulas; per-phase visibility comes from a real createBootShow run.
 *
 *   node gen-shots.mjs
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT = 'dsh-plugin-boot-whale-maid/docs/shots';

// ---- PNG ------------------------------------------------------------------
let CRC_T = null;
function crc32(buf) {
    if (!CRC_T) {
        CRC_T = new Int32Array(256);
        for (let n = 0; n < 256; n += 1) {
            let c = n;
            for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
            CRC_T[n] = c;
        }
    }
    let c = -1;
    for (let i = 0; i < buf.length; i += 1) c = CRC_T[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
}
function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
}
function encodePng(w, h, rgba) {
    const raw = Buffer.alloc((w * 4 + 1) * h);
    for (let y = 0; y < h; y += 1) {
        raw[y * (w * 4 + 1)] = 0;
        rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; ihdr[9] = 6;
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

// ---- painter --------------------------------------------------------------
function hex(s) {
    const v = s.replace('#', '');
    const n = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16), 255];
}
class Painter {
    constructor(w, h) { this.w = w; this.h = h; this.buf = Buffer.alloc(w * h * 4); }
    px(x, y, rgb, a) {
        if (a <= 0) return;
        const xi = Math.round(x); const yi = Math.round(y);
        if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h) return;
        const i = (yi * this.w + xi) * 4;
        const sa = Math.min(1, a); const da = this.buf[i + 3] / 255;
        const oa = sa + da * (1 - sa);
        if (oa <= 0) return;
        for (let c = 0; c < 3; c += 1) {
            this.buf[i + c] = Math.round((rgb[c] * sa + this.buf[i + c] * da * (1 - sa)) / oa);
        }
        this.buf[i + 3] = Math.round(oa * 255);
    }
    rect(x0, y0, x1, y1, rgb, a = 1) {
        const xa = Math.max(0, Math.floor(Math.min(x0, x1))); const xb = Math.min(this.w - 1, Math.ceil(Math.max(x0, x1)));
        const ya = Math.max(0, Math.floor(Math.min(y0, y1))); const yb = Math.min(this.h - 1, Math.ceil(Math.max(y0, y1)));
        for (let y = ya; y <= yb; y += 1) for (let x = xa; x <= xb; x += 1) this.px(x, y, rgb, a);
    }
    ellipse(cx, cy, rx, ry, rgb, a = 1) {
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
            for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
                if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.px(x, y, rgb, a);
            }
        }
    }
    line(x0, y0, x1, y1, rgb, a = 1, t = 1) {
        const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2) + 1;
        for (let s = 0; s <= n; s += 1) {
            const k = s / n;
            if (t <= 1) this.px(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, rgb, a);
            else this.rect(x0 + (x1 - x0) * k - t / 2, y0 + (y1 - y0) * k - t / 2, x0 + (x1 - x0) * k + t / 2, y0 + (y1 - y0) * k + t / 2, rgb, a);
        }
    }
    radial(rx, ry, cxP, cyP, rgb, a, stop) {
        const cx = rx * cxP; const cy = ry * cyP;
        for (let y = 0; y <= Math.ceil(ry); y += 1) {
            for (let x = 0; x <= Math.ceil(rx); x += 1) {
                const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
                if (d < stop) this.px(x, y, rgb, a * (1 - d / stop));
            }
        }
    }
    gv(x0, y0, x1, y1, stops) {
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y += 1) {
            const rgb = pick(stops, (y - y0) / Math.max(1, y1 - y0));
            for (let x = Math.floor(x0); x <= Math.ceil(x1); x += 1) this.px(x, y, rgb, 1);
        }
    }
    gh(x0, y0, x1, y1, stops) {
        for (let x = Math.floor(x0); x <= Math.ceil(x1); x += 1) {
            const rgb = pick(stops, (x - x0) / Math.max(1, x1 - x0));
            for (let y = Math.floor(y0); y <= Math.ceil(y1); y += 1) this.px(x, y, rgb, 1);
        }
    }
    box(x0, y0, x1, y1, rgb, a = 1, t = 1) {
        this.line(x0, y0, x1, y0, rgb, a, t); this.line(x1, y0, x1, y1, rgb, a, t);
        this.line(x1, y1, x0, y1, rgb, a, t); this.line(x0, y1, x0, y0, rgb, a, t);
    }
}
function pick(stops, t) {
    let prev = stops[0];
    for (const s of stops) {
        if (t <= s.at) {
            const span = s.at - prev.at;
            const k = span <= 0 ? 0 : (t - prev.at) / span;
            return [0, 1, 2].map((c) => Math.round(prev.rgb[c] + (s.rgb[c] - prev.rgb[c]) * k)).concat(255);
        }
        prev = s;
    }
    return prev.rgb;
}

// ---- 5x7 font -------------------------------------------------------------
const FONT = {
    A: [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11], B: [0x1E, 0x11, 0x11, 0x1E, 0x11, 0x11, 0x1E],
    C: [0x0E, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0E], D: [0x1E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1E],
    E: [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x1F], F: [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10],
    G: [0x0E, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0F], H: [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
    I: [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E], J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0C],
    K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11], L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F],
    M: [0x11, 0x1B, 0x15, 0x15, 0x11, 0x11, 0x11], N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
    O: [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E], P: [0x1E, 0x11, 0x11, 0x1E, 0x10, 0x10, 0x10],
    Q: [0x0E, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0D], R: [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x11],
    S: [0x0F, 0x10, 0x10, 0x0E, 0x01, 0x01, 0x1E], T: [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
    U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E], V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
    W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1B, 0x11], X: [0x11, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0x11],
    Y: [0x11, 0x11, 0x0A, 0x04, 0x04, 0x04, 0x04], Z: [0x1F, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1F],
    0: [0x0E, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0E], 1: [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E],
    2: [0x0E, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1F], 3: [0x1F, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0E],
    4: [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02], 5: [0x1F, 0x10, 0x1E, 0x01, 0x01, 0x11, 0x0E],
    6: [0x06, 0x08, 0x10, 0x1E, 0x11, 0x11, 0x0E], 7: [0x1F, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
    8: [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E], 9: [0x0E, 0x11, 0x11, 0x0F, 0x01, 0x02, 0x0C],
    ' ': [0, 0, 0, 0, 0, 0, 0], '.': [0, 0, 0, 0, 0, 0x0C, 0x0C], ',': [0, 0, 0, 0, 0x0C, 0x04, 0x08],
    ':': [0, 0x0C, 0x0C, 0, 0x0C, 0x0C, 0], '-': [0, 0, 0, 0x1F, 0, 0, 0], '/': [1, 2, 2, 4, 8, 8, 16],
    '(': [2, 4, 8, 8, 8, 4, 2], ')': [8, 4, 2, 2, 2, 4, 8], '+': [0, 4, 4, 0x1F, 4, 4, 0],
    '=': [0, 0, 0x1F, 0, 0x1F, 0, 0], '%': [0x18, 0x19, 2, 4, 8, 0x13, 3], '#': [0x0A, 0x1F, 0x0A, 0x0A, 0x1F, 0x0A, 0],
};
function text(p, str, x, y, sc, rgb, a = 1) {
    let cx = x;
    for (const ch of String(str).toUpperCase()) {
        const g = FONT[ch] || FONT[' '];
        for (let r = 0; r < 7; r += 1) {
            for (let c = 0; c < 5; c += 1) {
                if (g[r] & (1 << (4 - c))) p.rect(cx + c * sc, y + r * sc, cx + c * sc + sc - 1, y + r * sc + sc - 1, rgb, a);
            }
        }
        cx += 6 * sc;
    }
    return cx;
}
const tw = (s, sc) => String(s).length * 6 * sc;

// ---- geometry (identical formulas to lib/client.js) ----------------------
const RATIO_L = 1122 / 2019;
const RATIO_R = 1077 / 2048;
const RATIO_C = 620 / 553;
const GAP = 32;
const TWO = 1.0173;
const TITLE_MAX = 620;
const NAVY_DEEP = hex('#061421'); const NAVY_900 = hex('#08182b'); const NAVY_950 = hex('#0a1b2e');
const GOLD = hex('#c8ad73'); const IVORY = hex('#f2ece0');
const B1 = [18, 50, 72, 255]; const B2 = [61, 108, 122, 255];
const CA = hex('#03070e'); const CB = hex('#060e1a'); const CC = hex('#091424');

function geom(W, H) {
    const li = Math.max(8, Math.min(0.06 * W, 96));
    const ri = Math.max(8, Math.min(0.05 * W, 80));
    const lw = 0.96 * H * RATIO_L; const lh = 0.96 * H;
    const rw = 0.92 * H * RATIO_R; const rh = 0.92 * H;
    const cw = 0.15 * H * RATIO_C; const chh = 0.15 * H;
    const lRight = li + lw;
    const rLeft = W - ri - rw;
    const usable = rLeft - lRight - 2 * GAP;
    const showRight = W >= TWO * H + GAP && usable >= 320;
    const tLeft = showRight ? lRight + GAP : W * 0.52;
    const avail = Math.max(0, (showRight ? rLeft : W) - tLeft - GAP);
    const tMax = Math.max(200, Math.min(TITLE_MAX, showRight ? avail : 0.9 * TITLE_MAX));
    const painted = Math.min(0.4 * W, tMax, avail);
    return {
        li, ri, lw, lh, rw, rh, cw, chh, lRight, rLeft, usable, showRight,
        left: { x: li, y: H - lh, w: lw, h: lh },
        right: { x: rLeft, y: H - rh, w: rw, h: rh },
        chibi: { x: W - ri - 0.04 * W - cw, y: H - 0.015 * H - chh, w: cw, h: chh },
        title: { x: tLeft, y: 0.47 * H, w: painted },
        oldTitle: { x: 0.58 * W, w: Math.min(0.4 * W, 620) },
    };
}

// ---- stage layers ---------------------------------------------------------
function backdrop(p, W, H, dark) {
    p.gv(0, 0, W, H, [{ at: 0, rgb: NAVY_DEEP }, { at: 0.58, rgb: NAVY_900 }, { at: 1, rgb: NAVY_950 }]);
    p.radial(W * 1.2, H * 0.78, 0.30, 0.78, B1, 1, 0.62);
    p.radial(W * 0.9, H * 0.6, 0.72, 0.26, B2, 0.42, 0.70);
    if (dark > 0) p.rect(0, 0, W - 1, H - 1, hex('#040a13'), dark);
}
function arch(p, W, H, a) {
    const spans = [[0.04, 0.58], [0.22, 0.70], [0.40, 0.50], [0.58, 0.66], [0.76, 0.56]];
    for (const [l, hh] of spans) {
        const x0 = l * W; const w = 0.12 * W; const y0 = H - hh * H;
        p.rect(x0, y0, x0 + w, H - 1, GOLD, 0.14 * a);
        p.ellipse(x0 + w / 2, y0 + w * 0.34, w / 2, w * 0.34, GOLD, 0.13 * a);
    }
}
function palace(p, W, H, a) {
    p.rect(0, 0, W - 1, H - 1, hex('#0d1f33'), a);
    const sc = Math.max(W / 1586, H / 992);
    const dw = 1586 * sc; const dx = (W - dw) / 2;
    const aw = dw * 0.11;
    const xs = [0.08, 0.28, 0.50, 0.70]; const hs = [0.58, 0.72, 0.50, 0.66];
    for (let i = 0; i < xs.length; i += 1) {
        const cx = dx + dw * xs[i]; const hh = H * hs[i];
        p.rect(cx, H - hh, cx + aw, H - 1, hex('#16304a'), 0.95 * a);
        p.ellipse(cx + aw / 2, H - hh + aw * 0.5, aw / 2, aw * 0.5, hex('#16304a'), 0.95 * a);
    }
    p.rect(0, H - 0.11 * H, W - 1, H - 1, hex('#0a1726'), a);
    for (let y = 0; y < H; y += 1) {
        for (let x = 0; x < W; x += 1) {
            const d = Math.hypot((x - W * 0.32) / (W * 0.74), (y - H * 0.46) / (H * 0.66));
            if (d > 0.70) p.px(x, y, hex('#040a13'), Math.min(1, (d - 0.70) / 0.30) * 0.72 * a);
        }
    }
}
function tail(p, W, H, a) {
    if (a <= 0.001) return;
    const sw = Math.min(0.46 * W, 820); const sh = sw * (300 / 420);
    const x0 = -0.06 * W + 0.62 * sw * 0.5; const y0 = H - 0.22 * H - sh;
    p.ellipse(x0 + sw * 0.42, y0 + sh * 0.5, sw * 0.30, sh * 0.22, hex('#0a1a2a'), 0.92 * a);
    p.ellipse(x0 + sw * 0.62, y0 + sh * 0.32, sw * 0.24, sh * 0.17, hex('#0a1a2a'), 0.92 * a);
    p.ellipse(x0 + sw * 0.62, y0 + sh * 0.68, sw * 0.24, sh * 0.17, hex('#0a1a2a'), 0.92 * a);
    p.line(x0 + sw * 0.05, y0 + sh * 0.5, x0 + sw * 0.62, y0 + sh * 0.5, B2, 0.35 * a, 2);
}
function particles(p, W, H, a) {
    if (a <= 0.001) return;
    const pos = [[0.06, 0.72], [0.14, 0.64], [0.23, 0.57], [0.32, 0.50], [0.41, 0.44], [0.50, 0.39], [0.59, 0.35], [0.68, 0.31], [0.77, 0.28]];
    for (const [lx, ty] of pos) {
        const cx = lx * W + 0.08 * W; const cy = ty * H - 0.015 * H;
        for (let r = 8; r >= 1; r -= 1) p.ellipse(cx, cy, r, r, IVORY, (0.10 + 0.07 * (8 - r) / 8) * a);
        p.ellipse(cx, cy, 4.5, 4.5, IVORY, 0.95 * a);
    }
}
function sprite(p, r, a, label, tint) {
    if (a <= 0.001) { p.box(r.x, r.y, r.x + r.w, r.y + r.h, tint, 0.28, 1); return; }
    p.rect(r.x, r.y, r.x + r.w, r.y + r.h, tint, 0.30 * a);
    p.box(r.x, r.y, r.x + r.w, r.y + r.h, tint, 0.85 * a, 1);
    const cx = r.x + r.w / 2; const cy = r.y + r.h * 0.13; const rr = r.w * 0.30;
    p.ellipse(cx, cy, rr, rr, hex('#1b3a52'), 0.9 * a);
    p.box(cx - rr, cy - rr, cx + rr, cy + rr, GOLD, 0.8 * a, 1);
    if (r.w > tw(label, 2) + 8) text(p, label, cx - tw(label, 2) / 2, cy - 20, 2, IVORY, 0.95 * a);
}
function curtain(p, W, H, dx) {
    for (const off of [dx, W - 0.54 * W - dx]) panel(p, W, H, off, 0.54 * W);
}
function panel(p, W, H, x0, w) {
    p.gh(x0, 0, x0 + w, H - 1, [{ at: 0, rgb: CA }, { at: 0.46, rgb: CB }, { at: 1, rgb: CC }]);
    for (let x = Math.floor(x0); x <= Math.ceil(x0 + w); x += 1) {
        const ph = ((x - x0) % 26 + 26) % 26;
        if (ph < 6) p.rect(x, 0, x, H - 1, IVORY, 0.055);
        const edge = Math.min(x - x0, x0 + w - x);
        if (edge < 120) p.rect(x, 0, x, H - 1, [0, 0, 0, 255], (1 - edge / 120) * 0.6);
    }
}
function titleBlock(p, W, H, g) {
    const fs = Math.max(30, Math.min(0.037 * W, 58));
    const y0 = g.title.y - fs * 0.10;
    p.box(g.title.x, y0, g.title.x + g.title.w, y0 + fs * 1.16, GOLD, 0.55, 1);
    text(p, 'CJK TITLE BLOCK 6 GLYPHS', g.title.x + 6, y0 + fs * 0.5, 2, IVORY, 0.95);
    text(p, 'RESERVED, NOT REFLOWED', g.title.x + 6, y0 + fs * 0.5 + 18, 2, GOLD, 0.9);
    const ry = y0 + fs * 1.16 + Math.max(10, Math.min(0.014 * H, 18));
    p.gh(g.title.x, ry + 2, g.title.x + g.title.w, ry + 2, [{ at: 0, rgb: GOLD }, { at: 1, rgb: GOLD }]);
    text(p, 'ABYSSAL MAID ATELIER', g.title.x, ry + 5 + fs * 0.7, 2, GOLD, 0.95);
}
function footer(p, W, H, label, extra) {
    p.rect(0, H - 34, W - 1, H - 1, [0, 0, 0, 255], 0.88);
    text(p, label, 8, H - 28, 2, GOLD, 1);
    text(p, extra, 8, H - 14, 1, [200, 210, 220, 255], 1);
}
function banners(p, W) {
    p.rect(0, 0, W - 1, 26, [0, 0, 0, 255], 0.82);
    text(p, 'SOFTWARE-COMPUTED LAYOUT MAP - NOT A BROWSER SCREENSHOT', 8, 7, 2, GOLD, 1);
    text(p, 'PLACEHOLDER SPRITES - NOT THE REAL ARTWORK', 8, 50, 2, IVORY, 1);
}

// ---- three capture points (state from a real createBootShow run) ----------
const CAPS = [
    { f: '01-curtain-rise-0250ms.png', label: 'PHASE 1 - CURTAIN RISE (T=0.25S, SEGMENT S0)',
      dark: 1, palace: 0, left: 0, right: 0, chibi: 0, curtainDx: 0, tail: 0, part: 0, title: false },
    { f: '02-maids-landed-title-4000ms.png', label: 'PHASE 2 - MAIDS LANDED + TITLE (T=4.00S, SEGMENT S4)',
      dark: 0, palace: 1, left: 1, right: 1, chibi: 1, curtainDx: -0.54, tail: 0, part: 0, title: true },
    { f: '03-lace-tail-5000ms.png', label: 'PHASE 3 - LACE POINTS + TAIL (T=5.00S, SEGMENT S5)',
      dark: 0, palace: 1, left: 1, right: 1, chibi: 1, curtainDx: -0.54, tail: 0.5, part: 0.9, title: true },
];

mkdirSync(OUT, { recursive: true });
const W = 1280; const H = 720;
const g = geom(W, H);
for (const c of CAPS) {
    const p = new Painter(W, H);
    backdrop(p, W, H, c.dark);
    arch(p, W, H, 0.72);
    if (c.palace > 0) palace(p, W, H, c.palace);
    tail(p, W, H, c.tail);
    particles(p, W, H, c.part);
    if (c.left > 0 || true) sprite(p, g.left, c.left, 'MAID-LEFT STAND-IN', IVORY);
    if (g.showRight) sprite(p, g.right, c.right, 'MAID-RIGHT STAND-IN', IVORY);
    sprite(p, g.chibi, c.chibi, 'CHIBI', GOLD);
    if (c.curtainDx !== 0 || c.dark > 0) curtain(p, W, H, c.curtainDx * W);
    if (c.title) titleBlock(p, W, H, g);
    p.line(g.title.x, 0, g.title.x, H - 1, GOLD, 0.35, 1);
    p.line(g.title.x + g.title.w, 0, g.title.x + g.title.w, H - 1, GOLD, 0.35, 1);
    if (g.showRight) p.line(g.right.x, 0, g.right.x, H - 1, IVORY, 0.35, 1);
    banners(p, W);
    footer(p, W, H, c.label, 'VIEWPORT 1280X720  PLACEHOLDER SVG PREVIEW ONLY');
    writeFileSync(OUT + '/' + c.f, encodePng(W, H, p.buf));
    console.log('wrote ' + c.f);
}

// ---- shot 04: the F9 geometry at 1920x1080 -------------------------------
const W4 = 1920; const H4 = 1080;
const g4 = geom(W4, H4);
const p4 = new Painter(W4, H4);
p4.rect(0, 0, W4 - 1, H4 - 1, NAVY_DEEP, 1);
for (let x = 0; x <= W4; x += 100) p4.line(x, 60, x, H4 - 60, hex('#123248'), 0.55, 1);
for (let y = 60; y <= H4 - 60; y += 100) p4.line(0, y, W4 - 1, y, hex('#123248'), 0.55, 1);
for (let x = 0; x <= W4; x += 200) text(p4, String(x), x + 3, 66, 2, hex('#3d6c7a'), 1);
p4.rect(g4.left.x, g4.left.y, g4.left.x + g4.left.w, H4, hex('#16304a'), 0.35);
p4.box(g4.left.x, g4.left.y, g4.left.x + g4.left.w, H4, IVORY, 0.9, 2);
text(p4, 'MAID-LEFT 96%H', g4.left.x + 8, g4.left.y + 10, 2, IVORY, 1);
text(p4, 'X ' + g4.li.toFixed(0) + ' -> ' + g4.lRight.toFixed(1), g4.left.x + 8, g4.left.y + 30, 2, IVORY, 1);
p4.rect(g4.right.x, g4.right.y, g4.right.x + g4.right.w, H4, hex('#16304a'), 0.35);
p4.box(g4.right.x, g4.right.y, g4.right.x + g4.right.w, H4, IVORY, 0.9, 2);
text(p4, 'MAID-RIGHT 92%H', g4.right.x + 8, g4.right.y + 10, 2, IVORY, 1);
text(p4, 'X ' + g4.rLeft.toFixed(1) + ' -> ' + (W4 - g4.ri).toFixed(0), g4.right.x + 8, g4.right.y + 30, 2, IVORY, 1);
const ty = 0.47 * H4;
p4.rect(g4.title.x, ty - 60, g4.title.x + g4.title.w, ty + 60, GOLD, 0.30);
p4.box(g4.title.x, ty - 60, g4.title.x + g4.title.w, ty + 60, GOLD, 1, 2);
text(p4, 'TITLE BOX (CURRENT)', g4.title.x + 8, ty - 48, 2, GOLD, 1);
text(p4, 'LEFT ' + g4.title.x.toFixed(1) + '  W ' + g4.title.w.toFixed(1), g4.title.x + 8, ty - 28, 2, GOLD, 1);
text(p4, 'RIGHT ' + (g4.title.x + g4.title.w).toFixed(1), g4.title.x + 8, ty - 8, 2, GOLD, 1);
text(p4, 'SOURCE: TITLERIGHT = LEFTRIGHT + 32', g4.title.x + 8, ty + 12, 2, GOLD, 0.9);
text(p4, 'CAP: --WM-TITLE-MAX / --WM-TITLE-AVAIL', g4.title.x + 8, ty + 32, 2, GOLD, 0.9);
p4.box(g4.oldTitle.x, ty + 80, g4.oldTitle.x + g4.oldTitle.w, ty + 200, hex('#8a6a3a'), 0.95, 2);
text(p4, 'OLD 58% / MIN(40VW,620PX) BOX - WOULD OVERLAP BY '
    + Math.max(0, g4.oldTitle.x + g4.oldTitle.w - g4.rLeft).toFixed(0) + 'PX',
    g4.oldTitle.x, ty + 210, 2, hex('#8a6a3a'), 1);
p4.line(g4.title.x + g4.title.w, ty, g4.rLeft, ty, IVORY, 0.9, 3);
text(p4, 'CLEARANCE ' + (g4.rLeft - (g4.title.x + g4.title.w)).toFixed(0) + 'PX',
    (g4.title.x + g4.title.w + g4.rLeft) / 2 - 90, ty - 16, 2, IVORY, 1);
p4.rect(0, 0, W4 - 1, 46, [0, 0, 0, 255], 0.85);
text(p4, 'F9 GEOMETRY - 1920X1080 - SOFTWARE-COMPUTED FROM FROZEN LIB/CLIENT.JS', 10, 8, 2, GOLD, 1);
text(p4, 'NOT A BROWSER SCREENSHOT', 10, 26, 2, IVORY, 1);
p4.rect(0, H4 - 40, W4 - 1, H4 - 1, [0, 0, 0, 255], 0.88);
text(p4, 'GAP BETWEEN SPRITES ' + (g4.rLeft - g4.lRight).toFixed(1) + 'PX   USABLE ' + g4.usable.toFixed(1)
    + 'PX   TITLE PAINTED ' + g4.title.w.toFixed(1) + 'PX', 10, H4 - 30, 2, GOLD, 1);
writeFileSync(OUT + '/04-f9-geometry-1920x1080.png', encodePng(W4, H4, p4.buf));
console.log('wrote 04-f9-geometry-1920x1080.png');

console.log(JSON.stringify({
    '1280x720': { showRight: g.showRight, titleX: +g.title.x.toFixed(2), titleW: +g.title.w.toFixed(2), rightX: +g.right.x.toFixed(2) },
    '1920x1080': { showRight: g4.showRight, titleX: +g4.title.x.toFixed(2), titleW: +g4.title.w.toFixed(2), titleRight: +(g4.title.x + g4.title.w).toFixed(2), rightLeft: +g4.rLeft.toFixed(2), clearance: +(g4.rLeft - (g4.title.x + g4.title.w)).toFixed(2), oldOverlap: +(g4.oldTitle.x + g4.oldTitle.w - g4.rLeft).toFixed(2) },
}, null, 1));

// self-check: the artefacts must exist and be real PNGs
for (const c of CAPS) {
    const b = readFileSync(OUT + '/' + c.f);
    if (b[0] !== 0x89 || b.toString('ascii', 1, 4) !== 'PNG') throw new Error('bad png ' + c.f);
}
console.log('OK');
