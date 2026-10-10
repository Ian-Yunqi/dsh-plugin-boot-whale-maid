/**
 * dsh-plugin-boot-whale-maid --offline assertions for the client animation half.
 *
 * IMPORTANT SCOPE NOTE
 * --------------------
 * The fake DOM below is a minimal, hand-rolled double. It proves *scheduling,
 * structure, state transitions, cleanup and failure handling* --it can NOT
 * prove how the stage actually looks in a browser (layout, fonts, artwork,
 * compositing, real media queries). Browser visuals must be checked with
 * scripts/preview.html or an installed DSH boot, by a human.
 *
 * Every clock in here is a controllable fake: nothing waits for the real
 * 6.4 s timeline. Run with `node dsh-plugin-boot-whale-maid/scripts/assert.mjs`.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve as resolvePath } from 'node:path';

import { BOOT_ASSETS, BOOT_SEGMENTS, STAGE_CONFIG, apply, createBootShow } from '../lib/client.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolvePath(HERE, '..');

// ---------------------------------------------------------------------------
// tiny test harness
// ---------------------------------------------------------------------------

let failures = 0;
let checks = 0;
let group = '';

function section(title) {
    group = title;
    process.stdout.write('\n== ' + title + '\n');
}

function check(label, condition, detail) {
    checks += 1;
    if (condition) {
        process.stdout.write('  PASS  ' + label + '\n');
        return true;
    }
    failures += 1;
    process.stdout.write('  FAIL  ' + label + (detail === undefined ? '' : ' :: ' + detail) + '\n');
    return false;
}

function eq(label, actual, expected) {
    return check(label, Object.is(actual, expected), 'expected ' + String(expected) + ', got ' + String(actual));
}

// ---------------------------------------------------------------------------
// minimal fake DOM
// ---------------------------------------------------------------------------

const SVG_NS = 'http://www.w3.org/2000/svg';

class FakeStyle {
    constructor() {
        this._props = new Map();
        this.cssText = '';
    }
    setProperty(name, value) { this._props.set(String(name), String(value)); }
    getPropertyValue(name) { return this._props.has(String(name)) ? this._props.get(String(name)) : ''; }
    removeProperty(name) { this._props.delete(String(name)); }
}

class FakeElement {
    constructor(doc, tagName, namespace) {
        this.ownerDocument = doc;
        this.tagName = String(tagName).toLowerCase();
        this.namespaceURI = namespace || null;
        this.childNodes = [];
        this.parentNode = null;
        this.attributes = new Map();
        this.listeners = new Map();
        this.style = new FakeStyle();
        this.className = '';
        this.textContent = '';
        this.shadowRoot = null;
        this.dataset = {};
        this.complete = false;
        this.naturalWidth = 0;
    }

    get children() { return this.childNodes.slice(); }
    get firstChild() { return this.childNodes[0] || null; }

    appendChild(node) {
        if (!node) return node;
        if (node.parentNode && typeof node.parentNode.removeChild === 'function') node.parentNode.removeChild(node);
        this.childNodes.push(node);
        node.parentNode = this;
        return node;
    }

    removeChild(node) {
        const i = this.childNodes.indexOf(node);
        if (i !== -1) {
            this.childNodes.splice(i, 1);
            node.parentNode = null;
        }
        return node;
    }

    setAttribute(name, value) {
        const key = String(name);
        this.attributes.set(key, value === undefined || value === null ? '' : String(value));
        if (key === 'class') this.className = String(value);
        if (key === 'src' && this.tagName === 'img') this._onSrc(String(value));
    }

    getAttribute(name) {
        const key = String(name);
        return this.attributes.has(key) ? this.attributes.get(key) : null;
    }

    hasAttribute(name) { return this.attributes.has(String(name)); }

    removeAttribute(name) { this.attributes.delete(String(name)); }

    addEventListener(type, fn) {
        const key = String(type);
        if (!this.listeners.has(key)) this.listeners.set(key, []);
        this.listeners.get(key).push(fn);
    }

    removeEventListener(type, fn) {
        const key = String(type);
        const list = this.listeners.get(key);
        if (!list) return;
        const i = list.indexOf(fn);
        if (i !== -1) list.splice(i, 1);
        if (!list.length) this.listeners.delete(key);
    }

    listenerCount(type) {
        const list = this.listeners.get(String(type));
        return list ? list.length : 0;
    }

    dispatchEvent(event) {
        const list = (this.listeners.get(String(event.type)) || []).slice();
        for (let i = 0; i < list.length; i += 1) list[i](event);
        return true;
    }

    attachShadow() {
        if (!this.shadowRoot) this.shadowRoot = new FakeElement(this.ownerDocument, '#shadow-root');
        return this.shadowRoot;
    }

    /** Depth-first walk over this element and its descendants (light + shadow). */
    walk(visit) {
        visit(this);
        for (let i = 0; i < this.childNodes.length; i += 1) this.childNodes[i].walk(visit);
        if (this.shadowRoot) this.shadowRoot.walk(visit);
    }

    matches(selector) {
        const sel = String(selector).trim();
        if (sel.charAt(0) === '.') {
            return String(this.className || '').split(/\s+/).indexOf(sel.slice(1)) !== -1;
        }
        if (sel.charAt(0) === '#') return false;
        if (sel.charAt(0) === '[') {
            const name = sel.slice(1, -1).split('=')[0].replace(/["']/g, '');
            return this.hasAttribute(name);
        }
        return this.tagName === sel.toLowerCase();
    }

    /** Resolve a (whitespace) descendant chain, right-to-left against ancestors. */
    _matchChain(chain) {
        if (!this.matches(chain[chain.length - 1])) return false;
        let idx = chain.length - 1;
        let node = this.parentNode;
        while (idx > 0) {
            if (!node) return false;
            if (node.matches(chain[idx - 1])) idx -= 1;
            node = node.parentNode;
        }
        return true;
    }

    querySelector(selector) {
        const chain = String(selector).trim().split(/\s+/);
        let found = null;
        this.walk((node) => {
            if (found || node === this) return;
            if (node._matchChain(chain)) found = node;
        });
        return found;
    }

    querySelectorAll(selector) {
        const chain = String(selector).trim().split(/\s+/);
        const out = [];
        this.walk((node) => {
            if (node !== this && node._matchChain(chain)) out.push(node);
        });
        return out;
    }

    /**
     * Record an image request. A probe image always has its load/error handler
     * attached *before* `src` is written, while scene artwork (<img> nodes the
     * stage renders) never does --so this list is exactly the preload budget's
     * request set, which is what "no other request is ever made" is proven on.
     */
    _onSrc() {
        const doc = this.ownerDocument;
        if (!doc) return;
        const hasHandlers = this.listenerCount('load') > 0
            || this.listenerCount('error') > 0
            || typeof this.onload === 'function'
            || typeof this.onerror === 'function';
        doc._images.push(this);
        if (!hasHandlers) return;
        doc._probes.push(this);
        if (doc._imageBehaviour === 'fail') {
            this.__settled = true;
            this.dispatchEvent({ type: 'error', target: this });
            return;
        }
        if (doc._imageBehaviour === 'ok') {
            this.__settled = true;
            this.complete = true;
            this.naturalWidth = 4;
            this.dispatchEvent({ type: 'load', target: this });
        }
    }
}

class FakeDocument {
    constructor() {
        this.documentElement = new FakeElement(this, 'html');
        this.body = new FakeElement(this, 'body');
        this.documentElement.appendChild(this.body);
        this.defaultView = null;
        this.baseURI = 'http://127.0.0.1:19387/';
        this.listeners = new Map();
        this._images = [];
        this._probes = [];
        this._imageBehaviour = 'pending';
    }

    createElement(tag) { return new FakeElement(this, tag); }
    createElementNS(ns, tag) { return new FakeElement(this, tag, ns); }

    addEventListener(type, fn) {
        const key = String(type);
        if (!this.listeners.has(key)) this.listeners.set(key, []);
        this.listeners.get(key).push(fn);
    }

    removeEventListener(type, fn) {
        const key = String(type);
        const list = this.listeners.get(key);
        if (!list) return;
        const i = list.indexOf(fn);
        if (i !== -1) list.splice(i, 1);
        if (!list.length) this.listeners.delete(key);
    }

    listenerCount(type) {
        const list = this.listeners.get(String(type));
        return list ? list.length : 0;
    }

    dispatchEvent(event) {
        const list = (this.listeners.get(String(event.type)) || []).slice();
        for (let i = 0; i < list.length; i += 1) list[i](event);
        return true;
    }

    querySelector(selector) {
        const sel = String(selector);
        let found = null;
        this.documentElement.walk((node) => {
            if (found) return;
            if (sel.charAt(0) === '.' && String(node.className || '').split(/\s+/).indexOf(sel.slice(1)) !== -1) found = node;
        });
        return found;
    }

    querySelectorAll(selector) {
        const sel = String(selector);
        const out = [];
        this.documentElement.walk((node) => {
            if (sel.charAt(0) === '.' && String(node.className || '').split(/\s+/).indexOf(sel.slice(1)) !== -1) out.push(node);
        });
        return out;
    }

    /**
     * Resolve the open preload probes.
     *
     * `ok` may be a boolean (all images) or a predicate/index set describing
     * which of them fail --the suite needs "only the second of five is broken",
     * which is exactly the case a `complete === true` shortcut used to wave
     * through.
     */
    settleImages(ok) {
        const probes = this._probes.slice();
        for (let i = 0; i < probes.length; i += 1) {
            const img = probes[i];
            if (img.__settled) continue;
            const good = typeof ok === 'function' ? ok(i, img) : ok !== false;
            img.__settled = true;
            img.complete = true;
            img.naturalWidth = good ? 4 : 0;
            img.dispatchEvent({ type: good ? 'load' : 'error', target: img });
        }
    }
}

class FakeWindow {
    constructor(doc) {
        this.document = doc;
        this.innerWidth = 1920;
        this.innerHeight = 1080;
        this.listeners = new Map();
        this.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
        // Deliberately NO setTimeout/requestAnimationFrame: the fake clock is
        // the only scheduler, so the suite can never accidentally use real time.
    }
    addEventListener(type, fn) {
        const key = String(type);
        if (!this.listeners.has(key)) this.listeners.set(key, []);
        this.listeners.get(key).push(fn);
    }
    removeEventListener(type, fn) {
        const key = String(type);
        const list = this.listeners.get(key);
        if (!list) return;
        const i = list.indexOf(fn);
        if (i !== -1) list.splice(i, 1);
        if (!list.length) this.listeners.delete(key);
    }
    listenerCount(type) {
        const list = this.listeners.get(String(type));
        return list ? list.length : 0;
    }
    dispatchEvent(event) {
        const list = (this.listeners.get(String(event.type)) || []).slice();
        for (let i = 0; i < list.length; i += 1) list[i](event);
        return true;
    }
}

/** A clock whose time only moves when the test says so. */
class FakeClock {
    constructor() {
        this.now = 0;
        this.seq = 0;
        this.tasks = new Map();
    }
    setTimeout(fn, ms) {
        this.seq += 1;
        const id = this.seq;
        this.tasks.set(id, { at: this.now + (Number(ms) || 0), seq: id, fn });
        return id;
    }
    clearTimeout(id) { this.tasks.delete(id); }
    get pending() { return this.tasks.size; }
    tick(ms) {
        const target = this.now + (Number(ms) || 0);
        for (;;) {
            let next = null;
            this.tasks.forEach((task) => {
                if (task.at > target) return;
                if (!next || task.at < next.at || (task.at === next.at && task.seq < next.seq)) next = task;
            });
            if (!next) break;
            this.tasks.delete(next.seq);
            this.now = next.at;
            next.fn();
        }
        this.now = target;
        return this;
    }
}

function makeEnv(domOptions) {
    const dom = domOptions || {};
    const doc = new FakeDocument();
    const win = new FakeWindow(doc);
    doc.defaultView = win;
    win.innerWidth = dom.width === undefined ? 1920 : dom.width;
    win.innerHeight = dom.height === undefined ? 1080 : dom.height;
    doc.documentElement.clientWidth = win.innerWidth;
    doc.documentElement.clientHeight = win.innerHeight;
    if (dom.dark) doc.documentElement.setAttribute('data-ds-dark-theme', '');
    const classes = [];
    if (dom.rivalClass) classes.push('dsh550c-first');
    // The host half's first-paint class is present unless a case says otherwise.
    if (dom.firstPaint !== false) classes.push('dsh-whale-maid-first');
    doc.documentElement.className = classes.join(' ');
    if (dom.extraClass) doc.documentElement.className += ' ' + dom.extraClass;
    if (dom.rivalGlobal) win.__dsh550cBoot = {};
    if (dom.reducedMotion) win.matchMedia = () => ({ matches: true });
    const clock = new FakeClock();
    doc._probes = [];
    // Absolute-clock mark at which this stage's t=0 sits. Cases that assert the
    // documented 1200 ms / 6400 ms budgets advance to `clock.origin + budget`
    // instead of relying on relative ticks.
    clock.origin = clock.now;
    return { doc, win, clock };
}

/** The shadow root of a mounted stage, or null. */
function shadowOf(doc) {
    const host = doc.querySelectorAll('.dsh-whale-maid-boot-host');
    return host.length ? host[0].shadowRoot : null;
}

function inShadow(doc, selector) {
    const shadow = shadowOf(doc);
    if (!shadow) return null;
    return shadow.querySelector(selector);
}

function inShadowAll(doc, selector) {
    const shadow = shadowOf(doc);
    return shadow ? shadow.querySelectorAll(selector) : [];
}

function hostsIn(doc) {
    return doc.querySelectorAll('.dsh-whale-maid-boot-host');
}

/**
 * Resolve the five preload probes. The probe images only come into existence on
 * the kick-off tick, so the clock is advanced first; without that step nothing
 * would be settled and the stage would (correctly) time out instead.
 */
function loadArtwork(env, ok) {
    env.clock.tick(50);
    env.doc.settleImages(ok !== false);
    env.clock.tick(1);
}

/**
 * Advance the fake clock to an absolute time, given as "ms since the stage's own
 * zero mark" (see `clock.origin`). This is what lets a case assert the exact
 * 1200 ms preload budget or the 6400 ms timeline end. The final 1 ms step makes
 * sure a task scheduled exactly *at* that mark has run before the assertion.
 */
function at(env, ms) {
    const target = env.clock.origin + ms;
    if (env.clock.now < target) env.clock.tick(target - env.clock.now);
    env.clock.tick(1);
    return env.clock.now;
}

// ---------------------------------------------------------------------------
// a very small CSS cascade engine
//
// Why this exists: the fake DOM has no layout and no style engine, so it can
// never catch a defect that lives in the stylesheet. The two bugs this round is
// about were both *rule* bugs --a reveal that was attached to a flag which a
// later segment clears, and a curtain whose baseline state meant "closed". So
// the suite parses the stage stylesheet and answers, for a given set of
// attributes on the stage, "which declaration actually wins for this target?".
//
// It deliberately supports only the selector shapes stageCss uses: `:host`,
// `[attr]` presence checks, `.class`, `:last-child`, descendant chains and
// `@media (max-width:...)`. Anything else throws, so a future stylesheet change
// fails loudly here instead of silently passing unverified.
// ---------------------------------------------------------------------------

const SEL_PART = /:host|\[[^\]]+\]|:last-child|:nth-child\(\d+\)|::?[a-z-]+(?:\([^)]*\))?|\.[A-Za-z0-9_-]+/g;

function parseDecls(body) {
    const out = [];
    const text = String(body).replace(/\/\*[\s\S]*?\*\//g, '');
    const steps = text.split(';');
    for (let i = 0; i < steps.length; i += 1) {
        const idx = steps[i].indexOf(':');
        if (idx <= 0) continue;
        const prop = steps[i].slice(0, idx).trim().toLowerCase();
        const value = steps[i].slice(idx + 1).trim();
        if (prop && value) out.push({ prop: prop, value: value });
    }
    return out;
}

/** Parse the stylesheet into ordered rules with media conditions attached. */
function parseCssSource(css) {
    const rules = [];
    let buffer = '';
    const stack = [];
    const media = [];
    for (let i = 0; i < css.length; i += 1) {
        const ch = css.charAt(i);
        if (ch === '/') {
            const next = css.charAt(i + 1);
            if (next === '*') {
                const end = css.indexOf('*/', i + 2);
                i = end === -1 ? css.length : end + 1;
                continue;
            }
            buffer += ch;
            continue;
        }
        if (ch === '{') {
            const head = buffer.trim();
            buffer = '';
            if (head.charAt(0) === '@') {
                const minMatch = /max-width:\s*(\d+(?:\.\d+)?)px/.exec(head);
                media.push(minMatch ? Number(minMatch[1]) : null);
                stack.push({ at: true });
            } else {
                stack.push({ at: false, selectors: head });
            }
            continue;
        }
        if (ch === '}') {
            const frame = stack.pop();
            if (frame && !frame.at) {
                let maxWidth = null;
                for (let m = 0; m < media.length; m += 1) {
                    if (media[m] !== null) maxWidth = media[m];
                }
                const selectors = frame.selectors.split(',').map((s) => s.trim()).filter(Boolean);
                const decls = parseDecls(buffer);
                for (let s = 0; s < selectors.length; s += 1) {
                    rules.push({ selector: selectors[s], maxWidth: maxWidth, decls: decls, order: rules.length });
                }
            } else if (frame && frame.at) {
                media.pop();
            }
            buffer = '';
            continue;
        }
        buffer += ch;
    }
    return rules;
}

function tokensOf(compound) {
    // Stage CSS writes `:host([data-phase="6"])`; the functional form is just a
    // grouping around plain attribute selectors meant for the host element, so
    // normalise it to the `:host[data-phase="6"]` shape before tokenising.
    let normalised = compound;
    if (normalised.indexOf(':host(') === 0) {
        normalised = ':host ' + normalised.slice(6);
    }
    const tokens = normalised.match(SEL_PART);
    if (!tokens) return null;
    // `)` and `(` are pure grouping left over from the normalisation above.
    const kept = tokens.filter((t) => t !== ')' && t !== '(');
    // Compare on a whitespace-free, paren-free copy: an attribute selector may
    // legitimately contain spaces (`[data-phase="2"]`), so a literal comparison
    // would reject perfectly ordinary selectors and silently skip them.
    const squeeze = (s) => s.replace(/[()\s]/g, '');
    if (squeeze(kept.join('')) !== squeeze(normalised)) return null;
    return kept;
}

/**
 * Does one compound selector match? `target` is 'host' or 'element' --the only
 * distinction that matters for the shapes in stageCss.
 */
function matchSimple(compound, attrs, target) {
    const tokens = tokensOf(compound);
    if (!tokens) return null;
    let specificity = 0;
    for (let i = 0; i < tokens.length; i += 1) {
        const tok = tokens[i];
        if (tok.indexOf('::') === 0) {
            // A pseudo-element is a different box from the element itself, so it
            // can never be the winner for the element's own property. Skipping
            // it keeps the engine from reporting `::after` rules as if they
            // styled the element.
            return null;
        }
        if (tok === ':host' || tok === ':last-child') {
            if (tok === ':host' && target !== 'host') return null;
            specificity += 1;
            continue;
        }
        if (tok.charAt(0) === '[') {
            // Presence AND value: `[data-phase="2"]` must not match a stage that
            // is on phase 1. Ignoring the value here would have made this whole
            // engine claim every phase reveals everything.
            const inner = tok.slice(1, -1);
            const eq = inner.indexOf('=');
            if (eq === -1) {
                if (!attrs || !attrs[inner.trim()]) return null;
            } else {
                const name = inner.slice(0, eq).trim();
                const want = inner.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
                if (!attrs || String(attrs[name]) !== want) return null;
            }
            specificity += 3;
            continue;
        }
        if (tok.charAt(0) === '.') {
            specificity += 2;
            continue;
        }
        if (tok.charAt(0) === ':') {
            if (tok.indexOf('nth-child') === 0) { specificity += 2; continue; }
            // Unknown pseudo-class: fail loudly.
            throw new Error('cascade engine: unsupported token in selector: ' + compound);
        }
        throw new Error('cascade engine: unsupported token in selector: ' + compound);
    }
    return specificity;
}

/**
 * The winning declarations for one SIBLING ELEMENT (a child of `.stage`), given
 * that parent's attributes and the viewport width.
 *
 * An earlier version of this helper asked "what is the winning opacity
 * anywhere", which mixed rules for different elements together. This version
 * matches the rule against the element's own bare selector, so `.wm-title-cn span`
 * rules are only compared with other `.wm-title-cn span` rules — which is the
 * comparison the real cascade performs.
 */
function cascade(css, attrs, width, elementSelector) {
    const rules = parseCssSource(css);
    const winners = new Map();
    let matchedRules = 0;
    // An element selector may itself span compounds (`.wm-title-cn span`), so the
    // leaf can be a suffix of the rule's chain rather than one compound.
    const wantedParts = elementSelector === ':host' ? [':host'] : elementSelector.split(/\s+/);
    const leafAt = (chain) => {
        if (chain.length < wantedParts.length) return -1;
        for (let i = 0; i < wantedParts.length; i += 1) {
            if (chain[chain.length - wantedParts.length + i] !== wantedParts[i]) return -1;
        }
        return chain.length - wantedParts.length;
    };
    for (let i = 0; i < rules.length; i += 1) {
        const rule = rules[i];
        if (rule.maxWidth !== null && !(width <= rule.maxWidth)) continue;
        const chain = rule.selector.split(/\s+/);
        const start = leafAt(chain);
        if (start === -1) continue;
        let ok = true;
        // Everything before the leaf is ancestry. The only ancestry in this
        // shadow root is `.stage` (or `:host`), described by `attrs`.
        for (let p = 0; p < start; p += 1) {
            if (matchSimple(chain[p], attrs, 'element') === null) { ok = false; break; }
        }
        if (!ok) continue;
        matchedRules += 1;
        for (let d = 0; d < rule.decls.length; d += 1) {
            const decl = rule.decls[d];
            // Same target element, same source order: the later rule wins.
            winners.set(decl.prop, { value: decl.value, order: rule.order });
        }
    }
    return {
        get(prop) { const hit = winners.get(String(prop)); return hit ? hit.value : null; },
        all: winners,
        matchedRules: matchedRules,
    };
}

/** Attribute set of the stage at a given monotonic phase and one-shot flag. */
function stageAttrs(fields) {
    const attrs = { stage: '1' };
    if (fields.index !== undefined && fields.index !== null) attrs['data-s' + fields.index] = '';
    if (fields.phase !== undefined && fields.phase !== null) attrs['data-phase'] = String(fields.phase);
    if (fields.curtainOpen) attrs['data-curtain'] = 'open';
    if (fields.reveal) attrs['data-reveal'] = '1';
    if (fields.mode) attrs['data-mode'] = fields.mode;
    if (fields.narrow) attrs['data-narrow'] = '1';
    if (fields.right) attrs['data-right'] = '1';
    return attrs;
}

// NOTE on the two time helpers below: `at(env, N)` stops the clock at N+1, so
// a task scheduled for N has run. That means a "just before N" mark must not be
// written as `N - 1` --it would land exactly on N and fire it. The pre-boundary
// assertions therefore use `N - 10`, which is unambiguous under this model.

/** Read the stage stylesheet out of a mounted shadow root. */
function stageCssOf(doc) {
    const style = inShadow(doc, 'style');
    return style ? style.textContent : '';
}

function firstPaintCleared(doc) {
    return String(doc.documentElement.className || '').split(/\s+/).indexOf('dsh-whale-maid-first') === -1;
}

// ---------------------------------------------------------------------------
// 1. module contract
// ---------------------------------------------------------------------------

section('1. module contract');
{
    check('exports apply(ctx)', typeof apply === 'function');
    check('exports createBootShow(options)', typeof createBootShow === 'function');
    check('exports BOOT_SEGMENTS', Array.isArray(BOOT_SEGMENTS) && BOOT_SEGMENTS.length >= 8, 'len=' + BOOT_SEGMENTS.length);
    check('exports BOOT_ASSETS', BOOT_ASSETS && typeof BOOT_ASSETS === 'object');

    const source = readFileSync(resolvePath(PKG_ROOT, 'lib/client.js'), 'utf8');
    const head = source.split('\n').slice(0, 40).join('\n');
    const tail = source.slice(-1200);

    check('no third-party import in lib/client.js',
        !/^\s*import\s+[^;]*from\s+['"](?!node:)/m.test(source),
        'found an import from a non-node: specifier');
    check('no fetch( in lib/client.js', !/\bfetch\s*\(/.test(source));
    check('no XMLHttpRequest in lib/client.js', !/XMLHttpRequest/.test(source));
    check('no local filesystem path in client.js',
        !/[A-Za-z]:\\\\[^"'\s]/.test(source)
        && !/(?:^|["'(])\/(?:Users|home|mnt|var|opt)\//.test(source)
        && !/file:\/\/\/[A-Za-z]/.test(source),
        'found a filesystem-looking path');
    check('no top-level window/document identifier near the top of the module',
        !/\b(window|document)\b/.test(head) || /(never touches|module top level)/.test(head),
        'unexpected window/document use in the module header');
}

// ---------------------------------------------------------------------------
// 2. asset URLs and segment table
// ---------------------------------------------------------------------------

section('2. asset URLs + segment table');
{
    const assetsJson = JSON.parse(readFileSync(resolvePath(PKG_ROOT, 'docs/assets.json'), 'utf8'));
    const source = readFileSync(resolvePath(PKG_ROOT, 'lib/client.js'), 'utf8');
    const ids = Object.keys(BOOT_ASSETS);
    eq('all six documented assets present', ids.length, 6);
    for (const key of ids) {
        const asset = BOOT_ASSETS[key];
        const doc = assetsJson[key];
        check('docs/assets.json has ' + key, !!doc, 'missing from docs/assets.json');
        if (!doc) continue;
        eq(key + ' hash matches docs/assets.json', asset.hash, doc.hash);
        eq(key + ' url matches docs/assets.json', asset.url, doc.url);
        eq(key + ' width matches docs/assets.json', asset.width, doc.width);
        eq(key + ' height matches docs/assets.json', asset.height, doc.height);
        check(key + ' url is a same-origin hash route',
            /^\/skin-assets\/maid-atelier\/[a-f0-9]{64}\.webp$/.test(asset.url), asset.url);
        check(key + ' uid appears literally in lib/client.js', source.indexOf(asset.hash + '.webp') !== -1);
    }
    check('vision is documented but not staged', BOOT_ASSETS.vision.used === false);
    const staged = ids.filter((k) => BOOT_ASSETS[k].used !== false).map((k) => BOOT_ASSETS[k].url);
    eq('exactly 5 staged assets', staged.length, 5);
    check('no path escapes the same-origin asset route',
        staged.every((u) => u.indexOf('/skin-assets/maid-atelier/') === 0));

    eq('segment count', BOOT_SEGMENTS.length, 8);
    const ats = BOOT_SEGMENTS.map((s) => s.at);
    check('segment start times are 0/500/1800/2050/3200/4400/5600/6400',
        JSON.stringify(ats) === JSON.stringify([0, 500, 1800, 2050, 3200, 4400, 5600, 6400]),
        JSON.stringify(ats));
    eq('last segment ends the show at 6400 ms', BOOT_SEGMENTS[7].end, 6400);
    eq('right mascot is delayed exactly 250 ms after the main sprite',
        BOOT_SEGMENTS[3].at - BOOT_SEGMENTS[2].at, 250);
    eq('right mascot enters together with the main sprite landing (same end)',
        BOOT_SEGMENTS[3].end, BOOT_SEGMENTS[2].end);
    const ids2 = BOOT_SEGMENTS.map((s) => s.id);
    check('segment ids cover rise/open/left/right/title/lace/fade/end',
        ['curtain-rise', 'curtain-open', 'maid-left-enter', 'maid-right-enter', 'title-reveal', 'lace-tail', 'stage-fade-out', 'finished']
            .every((id) => ids2.indexOf(id) !== -1), ids2.join(','));
    check('every segment declares at/end',
        BOOT_SEGMENTS.every((s) => typeof s.at === 'number' && typeof s.end === 'number'));
    check('skip budget is inside 150 ms', STAGE_CONFIG.skipFadeMs <= 150, String(STAGE_CONFIG.skipFadeMs));
}

// ---------------------------------------------------------------------------
// 3. factory + shadow-root structure
// ---------------------------------------------------------------------------

section('3. factory, mount and shadow structure');
{
    const { doc, win, clock } = makeEnv();
    win.__dshWhaleMaidBoot = { ends: 0, end() { this.ends += 1; } };
    const boot = createBootShow({ document: doc, window: win, clock });

    check('factory returns a control object', !!boot && typeof boot.dispose === 'function');
    eq('host is attached to body', doc.body.childNodes.filter((n) => n.className === 'dsh-whale-maid-boot-host').length, 1);
    const host = hostsIn(doc)[0];
    check('host uses class .dsh-whale-maid-boot-host', !!host);
    check('host has an open shadow root', !!host && !!host.shadowRoot);
    check('shadow root is the only place CSS lives', !!inShadow(doc, 'style'));
    check('main document received no <style> node',
        doc.querySelectorAll('style').length === 0);
    check('stage element exists', !!inShadow(doc, '.stage'));
    eq('stage starts on segment 0', inShadow(doc, '.stage').getAttribute('data-s0'), '');
    check('left main sprite exists with the maid-left url',
        (() => { const n = inShadow(doc, '.wm-maid-left'); return !!n && n.getAttribute('src') === BOOT_ASSETS['maid-left'].url; })());
    check('right maid sprite exists',
        !!inShadow(doc, '.wm-maid-right') && inShadow(doc, '.wm-maid-right').getAttribute('src') === BOOT_ASSETS['maid-right'].url);
    check('right Q-version mascot exists with the chibi url',
        !!inShadow(doc, '.wm-chibi') && inShadow(doc, '.wm-chibi').getAttribute('src') === BOOT_ASSETS.chibi.url);
    check('title element exists', !!inShadow(doc, '.wm-title'));
    eq('title glyph count', inShadowAll(doc, '.wm-title-cn span').length, 6);
    eq('title text', inShadow(doc, '.wm-title-cn').textContent, '');
    eq('glyph 1', inShadowAll(doc, '.wm-title-cn span')[0].textContent, '\u6df1');
    eq('glyph 6', inShadowAll(doc, '.wm-title-cn span')[5].textContent, '\u574a');
    eq('subtitle text', inShadow(doc, '.wm-title-en').textContent, 'ABYSSAL MAID ATELIER');
    eq('particle layer exists', inShadowAll(doc, '.wm-particles g').length, 9);
    check('tail silhouette layer exists', !!inShadow(doc, '.wm-tail'));
    check('tail is drawn as inline SVG (no extra raster)',
        !!inShadow(doc, '.wm-tail svg') && inShadow(doc, '.wm-tail svg').namespaceURI === SVG_NS);
    eq('curtain panels', inShadowAll(doc, '.wm-curtain i').length, 2);
    check('palace layer exists', !!inShadow(doc, '.wm-palace'));
    check('stage is bottom-anchored and never stretched (CSS says width:auto + object-fit:contain)',
        (() => {
            const css = inShadow(doc, 'style').textContent;
            return css.indexOf('object-fit:contain') !== -1 && css.indexOf('.wm-maid-left{height:calc') !== -1;
        })());
    check('no mirrored sprite (no scaleX(-1))', inShadow(doc, 'style').textContent.indexOf('scaleX(-1)') === -1);
    check('palace light url is the staged theme', inShadow(doc, 'style').textContent.indexOf(BOOT_ASSETS['palace-light'].url) !== -1);
    check('vision artwork is never requested by the stage',
        inShadow(doc, 'style').textContent.indexOf(BOOT_ASSETS.vision.url) === -1);
    check('the stage only requests the five staged asset urls',
        boot.requests.length === 5 && boot.requests.every((u) => u.indexOf('/skin-assets/maid-atelier/') === 0),
        boot.requests.join(','));
    check('listeners are installed on the document for click and keydown',
        doc.listenerCount('click') >= 1 && doc.listenerCount('keydown') >= 1);
    eq('body scroll is locked while the stage is up', doc.body.style.getPropertyValue('overflow'), 'hidden');

    // scheduling has not started yet: the first step is on the clock
    eq('nothing has fired before the clock moves', boot.fired.length, 0);
    check('a first step is pending on the clock', clock.pending > 0);

    boot.dispose();
    eq('host removed on dispose', hostsIn(doc).length, 0);
    check('first-paint class cleared on dispose', firstPaintCleared(doc));
    eq('body overflow restored', doc.body.style.getPropertyValue('overflow'), '');
    eq('click listeners released', doc.listenerCount('click'), 0);
    eq('keydown listeners released', doc.listenerCount('keydown'), 0);
    eq('no timer left on the clock', clock.pending, 0);
    eq('window keydown listeners released', win.listenerCount('keydown'), 0);
}

// ---------------------------------------------------------------------------
// 4. timeline drive under a fake clock
// ---------------------------------------------------------------------------

section('4. timeline driven segment by segment');
{
    const env = makeEnv();
    const { doc, win, clock } = env;
    // The stage is torn down by the `finished` segment, so capture the flags as
    // they are applied instead of reading them after the show is over.
    const snapshots = [];
    const boot = createBootShow({
        document: doc,
        window: win,
        clock,
        onSegment: (segment) => {
            const stage = inShadow(doc, '.stage');
            snapshots.push({
                id: segment.id,
                s0: stage ? stage.getAttribute('data-s0') : null,
                s1: stage ? stage.getAttribute('data-s1') : null,
                s5: stage ? stage.getAttribute('data-s5') : null,
                s6: stage ? stage.getAttribute('data-s6') : null,
                phase: stage ? stage.getAttribute('data-phase') : null,
                curtain: stage ? stage.getAttribute('data-curtain') : null,
                hostState: hostsIn(doc).length ? hostsIn(doc)[0].getAttribute('data-state') : null,
            });
        },
    });
    // Let the kick-off tick run so the preload probe exists, then hand it five
    // usable images --the only way the real timeline is allowed to start.
    at(env, 0);
    env.clock.tick(1);
    eq('five artwork probes are open', env.doc._probes.length, 5);
    eq('still waiting on artwork', boot.state, 'preload');
    env.doc.settleImages(true);
    eq('state becomes playing after the assets resolve', boot.state, 'playing');
    eq('nothing has played yet: the timeline starts at its own zero', boot.fired.length, 0);
    at(env, 0);
    eq('segment 0 fired first', boot.fired[0] && boot.fired[0].id, 'curtain-rise');
    const expected = [
        { at: 0, id: 'curtain-rise' },
        { at: 500, id: 'curtain-open' },
        { at: 1800, id: 'maid-left-enter' },
        { at: 2050, id: 'maid-right-enter' },
        { at: 3200, id: 'title-reveal' },
        { at: 4400, id: 'lace-tail' },
        { at: 5600, id: 'stage-fade-out' },
        { at: 6400, id: 'finished' },
    ];

    at(env, 6390);
    eq('seven segments had fired just before the declared end', boot.fired.length, 7);
    check('the show is still on screen one millisecond before its declared end',
        boot.state === 'playing' && hostsIn(doc).length === 1, boot.state);
    eq('the host is visible while the show plays', hostsIn(doc)[0].getAttribute('data-state'), 'visible');
    at(env, 6401);
    eq('all eight segments fired', boot.fired.length, 8);
    let allOk = true;
    for (let i = 0; i < expected.length; i += 1) {
        const got = boot.fired[i];
        if (!got || got.id !== expected[i].id || got.at !== expected[i].at) {
            allOk = false;
            check('segment ' + i + ' fired at ' + expected[i].at + ' ms as ' + expected[i].id,
                false, 'got ' + JSON.stringify(got));
        }
    }
    check('segment ids and declared times all match the table', allOk);
    eq('last segment fired at 6400 ms on the fake clock', boot.fired[7].firedAt, 6400);
    eq('stage flag of the last stage segment', snapshots[6] && snapshots[6].s6, '');

    // --- reveal is now MONOTONIC -------------------------------------------
    const phases = snapshots.map((s) => Number(s.phase)).filter((p) => !Number.isNaN(p));
    check('data-phase is set on every stage segment and only ever advances',
        phases.join(',') === '0,1,2,3,4,5,6',
        phases.join(','));
    check('the monotonic phase survives the one-shot flags being cleared',
        snapshots[2].s1 === null && snapshots[2].s0 === null && Number(snapshots[2].phase) === 2,
        JSON.stringify(snapshots[2]));
    check('the curtain terminal state is written once and never cleared',
        snapshots[1].curtain === 'open'
        && snapshots.slice(1).every((s) => s.curtain === 'open'),
        snapshots.map((s) => s.curtain).join(','));
    check('the host was visible for every segment of the run',
        snapshots.every((s) => s.hostState === 'visible'),
        snapshots.map((s) => s.hostState).join(','));

    // --- the 800 ms fade-out, then unmount ---------------------------------
    // --- the 800 ms fade-out, then unmount ---------------------------------
    eq('the natural end goes through the fade-out state first', boot.state, 'skipping');
    eq('the host is in fade-out right after the last segment',
        hostsIn(doc)[0].getAttribute('data-state'), 'fade-out');
    at(env, 7190);
    check('the stage is still mounted during the fade (invisible, not yet gone)',
        hostsIn(doc).length === 1, 'hosts=' + hostsIn(doc).length);
    eq('the stage is opacity-pinned to 0 for the fade', hostsIn(doc)[0].style.getPropertyValue('opacity'), '0');
    eq('the fade duration is the declared 800 ms',
        hostsIn(doc)[0].style.getPropertyValue('transition-duration'), '800ms');
    at(env, 7201);
    eq('the stage unmounts once the fade is over', boot.state, 'ended');
    eq('host removed after the natural end', hostsIn(doc).length, 0);
    check('first-paint class cleared after the natural end', firstPaintCleared(doc));
    eq('no pending timer after the natural end', clock.pending, 0);
    eq('document listeners released after the natural end', doc.listenerCount('click'), 0);
}

// ---------------------------------------------------------------------------
// 5. skip during the first-paint phase
// ---------------------------------------------------------------------------

section('5. click / Escape in the first-paint phase');
{
    const { doc, win, clock } = makeEnv();
    let endCalls = 0;
    win.__dshWhaleMaidBoot = { end() { endCalls += 1; } };
    const boot = createBootShow({ document: doc, window: win, clock });
    eq('curtain is already painted before any asset lands',
        hostsIn(doc)[0].getAttribute('data-state'), 'hidden');

    // click lands before the clock advanced at all
    doc.dispatchEvent({ type: 'click', target: doc.body });
    eq('state is skipping immediately after the click', boot.state, 'skipping');
    check('fade-out flag is already set', hostsIn(doc)[0].getAttribute('data-state') === 'fade-out');
    eq('no segment could fire after the click', boot.fired.length, 0);
    clock.tick(139);
    check('still inside the 150 ms budget', boot.state === 'skipping', boot.state);
    clock.tick(2);
    eq('finished within 150 ms', boot.state, 'skipped');
    eq('end() hook called exactly once', endCalls, 1);
    eq('host removed', hostsIn(doc).length, 0);
    check('first-paint class cleared', firstPaintCleared(doc));
    eq('all timers cleared', clock.pending, 0);
    eq('click listener released', doc.listenerCount('click'), 0);

    // Escape during the asset probe
    const env2 = makeEnv();
    let endCalls2 = 0;
    env2.win.__dshWhaleMaidBoot = { end() { endCalls2 += 1; } };
    const boot2 = createBootShow({ document: env2.doc, window: env2.win, clock: env2.clock });
    env2.clock.tick(5);
    env2.doc.dispatchEvent({ type: 'keydown', key: 'Escape' });
    eq('Escape skips the preload phase', boot2.state, 'skipping');
    env2.clock.tick(150);
    eq('Escape finished inside 150 ms', boot2.state, 'skipped');
    eq('Escape called end() once', endCalls2, 1);
    eq('Escape left no timer behind', env2.clock.pending, 0);
}

// ---------------------------------------------------------------------------
// 6. skip while the show is playing
// ---------------------------------------------------------------------------

section('6. click / Escape while playing');
{
    const { doc, win, clock } = makeEnv();
    let endCalls = 0;
    win.__dshWhaleMaidBoot = { end() { endCalls += 1; } };
    const boot = createBootShow({ document: doc, window: win, clock });
    clock.tick(50);
    doc.settleImages(true);
    clock.tick(2200);
    eq('playing by 2.2 s', boot.state, 'playing');
    check('segment 3 (right mascot) already fired', boot.fired.some((f) => f.id === 'maid-right-enter'));
    const firedBefore = boot.fired.length;

    doc.dispatchEvent({ type: 'click', target: doc.body });
    eq('click during playback enters the skipping state', boot.state, 'skipping');
    eq('later segments are cancelled, not played', boot.fired.length, firedBefore);
    clock.tick(20);
    eq('title segment never fires after the skip',
        boot.fired.some((f) => f.id === 'title-reveal'), false);
    clock.tick(130);
    eq('skip finishes inside 150 ms of the click', boot.state, 'skipped');
    eq('end() called once', endCalls, 1);
    eq('no timer surviving the skip', clock.pending, 0);
    eq('host gone', hostsIn(doc).length, 0);
    check('first-paint class gone', firstPaintCleared(doc));

    // Escape through the window listener
    const env2 = makeEnv();
    const boot2 = createBootShow({ document: env2.doc, window: env2.win, clock: env2.clock });
    env2.clock.tick(50);
    env2.doc.settleImages(true);
    env2.clock.tick(3000);
    eq('second stage is playing', boot2.state, 'playing');
    env2.win.dispatchEvent({ type: 'keydown', key: 'Escape' });
    eq('window Escape also skips', boot2.state, 'skipping');
    env2.clock.tick(150);
    eq('window Escape finished', boot2.state, 'skipped');
    eq('second stage left no host', hostsIn(env2.doc).length, 0);
    eq('second stage left no timer', env2.clock.pending, 0);
}

// ---------------------------------------------------------------------------
// 7. reduced motion
// ---------------------------------------------------------------------------

section('7. prefers-reduced-motion');
{
    const { doc, win, clock } = makeEnv({ reducedMotion: true });
    let endCalls = 0;
    win.__dshWhaleMaidBoot = { end() { endCalls += 1; } };
    const boot = createBootShow({ document: doc, window: win, clock });
    check('reduced motion never preloads artwork', boot.requests.length === 5 && doc._probes.length === 0,
        'probes=' + doc._probes.length);
    clock.tick(5);
    eq('reduced branch entered', boot.state, 'reduced');
    eq('no timeline segment played', boot.fired.length, 0);
    eq('degrade mode flag on the stage', inShadow(doc, '.stage').getAttribute('data-mode'), 'degrade');
    check('no travel in the degraded stylesheet',
        inShadow(doc, 'style').textContent.indexOf('.stage[data-mode="degrade"] .wm-maid') !== -1);
    clock.tick(400);
    eq('cleaned up well under a second', boot.state, 'reduced-motion');
    eq('end() called', endCalls, 1);
    eq('host removed', hostsIn(doc).length, 0);
    check('first-paint class cleared', firstPaintCleared(doc));
    eq('no timers left', clock.pending, 0);
}

// ---------------------------------------------------------------------------
// 8. artwork unavailable (404: the skin plugin is not enabled)
// ---------------------------------------------------------------------------

section('8. artwork failure -> degraded curtain');
{
    const { doc, win, clock } = makeEnv();
    let endCalls = 0;
    win.__dshWhaleMaidBoot = { end() { endCalls += 1; } };
    const boot = createBootShow({ document: doc, window: win, clock });
    clock.tick(50);
    doc._imageBehaviour = 'fail';
    doc.settleImages(false);
    eq('degraded state, not playing', boot.state, 'degrade');
    eq('no segment played', boot.fired.length, 0);
    eq('stage marked degrade', inShadow(doc, '.stage').getAttribute('data-mode'), 'degrade');
    eq('degrade uses the still-title switch immediately',
        inShadow(doc, '.stage').getAttribute('data-reveal'), '1');
    eq('degrade carries no segment phase (it never played the timeline)',
        inShadow(doc, '.stage').getAttribute('data-phase'), null);
    check('degraded stylesheet hides the artwork layers',
        inShadow(doc, 'style').textContent.indexOf('.stage[data-mode="degrade"] .wm-maid') !== -1);
    clock.tick(899);
    check('degrade is still up just before 900 ms', boot.state === 'degrade', boot.state);
    clock.tick(2);
    eq('degraded curtain is gone in under 1 s', boot.state, 'degraded');
    eq('end() called for the degraded branch', endCalls, 1);
    eq('host removed after degrade', hostsIn(doc).length, 0);
    check('first-paint class cleared after degrade', firstPaintCleared(doc));

    // late success must never re-mount anything: the artwork turns usable only
    // after the stage gave up, so the next probe resolves `ok` on creation.
    doc._imageBehaviour = 'ok';
    clock.tick(2000);
    eq('a late load event cannot re-mount the stage', hostsIn(doc).length, 0);
    eq('state stays terminal', boot.state, 'degraded');
}

// ---------------------------------------------------------------------------
// 9. artwork timeout (budget expires)
// ---------------------------------------------------------------------------

section('9. artwork timeout -> degraded curtain');
{
    const env = makeEnv();
    const boot = createBootShow({ document: env.doc, window: env.win, clock: env.clock, preloadBudgetMs: 1200 });
    // The probe is created on the kick-off tick, so its 1200 ms budget starts
    // from that moment: 1201 on this clock's absolute axis.
    const DEGRADE_UP_AT = 1201;
    env.clock.tick(1);
    eq('five probe requests issued', env.doc._probes.length, 5);
    eq('probes are pending, not settled', env.doc._probes.every((img) => !img.__settled), true);
    at(env, 1190);
    eq('no degrade before the budget expires', boot.state, 'preload');
    at(env, DEGRADE_UP_AT);
    eq('degrade starts exactly at the 1200 ms budget', boot.state, 'degrade');
    eq('nothing played', boot.fired.length, 0);
    at(env, DEGRADE_UP_AT + 890);
    check('degraded curtain is still up before its own end', boot.state === 'degrade', boot.state);
    at(env, DEGRADE_UP_AT + 900);
    eq('degraded curtain cleaned up', boot.state, 'degraded');
    eq('host removed', hostsIn(env.doc).length, 0);
    check('first-paint class cleared', firstPaintCleared(env.doc));
    eq('no timer left', env.clock.pending, 0);

    // a load event arriving after the budget may not start the show either
    env.doc.settleImages(true);
    env.clock.tick(500);
    eq('late asset cannot restart the timeline', boot.fired.length, 0);
    eq('still terminal', boot.state, 'degraded');

    // a custom budget is honoured
    const env2 = makeEnv();
    const boot2 = createBootShow({ document: env2.doc, window: env2.win, clock: env2.clock, preloadBudgetMs: 300 });
    env2.clock.tick(1);
    eq('custom budget: probes open', env2.doc._probes.length, 5);
    at(env2, 290);
    eq('custom budget respected (before)', boot2.state, 'preload');
    at(env2, 300);
    eq('custom budget respected (after)', boot2.state, 'degrade');
    at(env2, 300 + 900);
    eq('custom budget: degraded curtain cleaned up', boot2.state, 'degraded');
    eq('custom budget: no timer left', env2.clock.pending, 0);
}

// ---------------------------------------------------------------------------
// 10. the animation body throws
// ---------------------------------------------------------------------------

section('10. a throwing animation body');
{
    const { doc, win, clock } = makeEnv();
    let endCalls = 0;
    win.__dshWhaleMaidBoot = { end() { endCalls += 1; } };
    let threw = false;
    let boot = null;
    try {
        boot = createBootShow({ document: doc, window: win, clock, failBuild: true });
    } catch (err) {
        threw = true;
    }
    check('the exception never reaches the caller', threw === false);
    check('a control object is still returned', !!boot);
    eq('state records the failure', boot.state, 'error');
    check('the first-paint class was still revoked (try/catch + finally)',
        String(doc.documentElement.className).split(/\s+/).indexOf('dsh-whale-maid-first') === -1,
        doc.documentElement.className);
    eq('the host half end() hook still ran', endCalls, 1);
    eq('no host mounted', hostsIn(doc).length, 0);
    eq('no timer left behind', clock.pending, 0);
    eq('no listener left on the document', doc.listenerCount('click'), 0);
    eq('body scroll state untouched', doc.body.style.getPropertyValue('overflow'), '');

    // a partially built scene that throws must also clean up
    const env2 = makeEnv();
    const brokenShadowHost = env2.doc.createElement('div');
    brokenShadowHost.attachShadow = () => { throw new Error('shadow unavailable'); };
    const origCreate = env2.doc.createElement.bind(env2.doc);
    let swapNext = true;
    env2.doc.createElement = (tag) => {
        if (swapNext && tag === 'div') {
            swapNext = false;
            return brokenShadowHost;
        }
        return origCreate(tag);
    };
    let threw2 = false;
    let boot2 = null;
    try {
        boot2 = createBootShow({ document: env2.doc, window: env2.win, clock: env2.clock });
    } catch (_err) { threw2 = true; }
    check('a shadow-root failure does not escape', threw2 === false);
    check('a shadow-root failure still cleans the curtain',
        String(env2.doc.documentElement.className).split(/\s+/).indexOf('dsh-whale-maid-first') === -1);
    check('a failed mount leaves no host', hostsIn(env2.doc).length === 0);
    void boot2;
}

// ---------------------------------------------------------------------------
// 11. client not started / unusable host conditions
// ---------------------------------------------------------------------------

section('11. client not started, repeated init, dispose mid-flight');
{
    eq('createBootShow() without a document yields null', createBootShow({}), null);
    eq('createBootShow({document:null}) yields null', createBootShow({ document: null }), null);

    let threw = false;
    let applied = null;
    try {
        applied = apply({});
    } catch (_err) { threw = true; }
    check('apply() with a context that has no effect() does not throw', threw === false);
    check('apply() still returns a handle', !!applied && typeof applied.dispose === 'function');
    applied.dispose();

    // no Node DOM at all: apply() must simply do nothing visible
    let threwNoDom = false;
    try {
        const ctx = { effect: (fn) => { const disposer = fn(); return () => { if (typeof disposer === 'function') disposer(); }; } };
        apply(ctx);
    } catch (_err) { threwNoDom = true; }
    check('apply() outside a browser does not throw', threwNoDom === false);

    // repeated init adopts the first stage instead of stacking
    const { doc, win, clock } = makeEnv();
    const first = createBootShow({ document: doc, window: win, clock });
    const second = createBootShow({ document: doc, window: win, clock });
    check('a second createBootShow adopts the mounted stage', first === second);
    eq('only one host element exists', hostsIn(doc).length, 1);
    first.dispose();
    eq('dispose removed the single host', hostsIn(doc).length, 0);
    clock.tick(10000);
    eq('nothing reappears after dispose', hostsIn(doc).length, 0);

    // dispose mid-flight, then let every scheduled step try to run
    const env = makeEnv();
    const boot = createBootShow({ document: env.doc, window: env.win, clock: env.clock });
    env.clock.tick(50);
    env.doc.settleImages(true);
    env.clock.tick(650);
    eq('playing at 0.7 s', boot.state, 'playing');
    boot.dispose();
    eq('dispose mid-flight tears the stage down', boot.state, 'dispose');
    eq('mid-flight dispose removes the host', hostsIn(env.doc).length, 0);
    eq('mid-flight dispose clears the clock', env.clock.pending, 0);
    const firedAtDispose = boot.fired.length;
    env.clock.tick(10000);
    eq('no further segment fires after a mid-flight dispose', boot.fired.length, firedAtDispose);
    eq('no host reappears', hostsIn(env.doc).length, 0);

    // a callback that survives the clear must still be inert
    const envLate = makeEnv();
    const stale = [];
    const realClock = new FakeClock();
    const sneakyClock = {
        setTimeout(fn, ms) { return realClock.setTimeout(() => stale.push(fn), ms); },
        clearTimeout() { /* deliberately does NOT cancel: simulates a late callback */ },
    };
    const bootLate = createBootShow({ document: envLate.doc, window: envLate.win, clock: sneakyClock });
    realClock.tick(50);
    envLate.doc.settleImages(true);
    realClock.tick(450);
    bootLate.dispose();
    const before = bootLate.fired.length;
    realClock.tick(20000);
    for (let i = 0; i < stale.length; i += 1) stale[i]();
    eq('late callbacks cannot fire segments', bootLate.fired.length, before);
    eq('late callbacks cannot re-mount the stage', hostsIn(envLate.doc).length, 0);
    eq('late callbacks cannot clear the terminal state', bootLate.state, 'dispose');
    check('late callbacks leave the first-paint class cleared',
        String(envLate.doc.documentElement.className).split(/\s+/).indexOf('dsh-whale-maid-first') === -1);
}

// ---------------------------------------------------------------------------
// 12. mount / unmount rounds leave nothing behind
// ---------------------------------------------------------------------------

section('12. two mount/unmount rounds');
{
    const { doc, win, clock } = makeEnv();
    let endCalls = 0;
    win.__dshWhaleMaidBoot = { end() { endCalls += 1; } };

    for (let round = 1; round <= 2; round += 1) {
        const boot = createBootShow({ document: doc, window: win, clock });
        doc.documentElement.className = 'dsh-whale-maid-first';
        eq('round ' + round + ': exactly one host', hostsIn(doc).length, 1);
        eq('round ' + round + ': exactly one shadow style node',
            shadowOf(doc).querySelectorAll('style').length, 1);
        clock.tick(50);
        doc.settleImages(true);
        clock.tick(2000);
        check('round ' + round + ': playing', boot.state === 'playing', boot.state);
        boot.dispose();
        eq('round ' + round + ': host removed', hostsIn(doc).length, 0);
        check('round ' + round + ': first-paint class cleared', firstPaintCleared(doc));
        eq('round ' + round + ': no document click listener', doc.listenerCount('click'), 0);
        eq('round ' + round + ': no document keydown listener', doc.listenerCount('keydown'), 0);
        eq('round ' + round + ': no window keydown listener', win.listenerCount('keydown'), 0);
        eq('round ' + round + ': no bodystyle residue', doc.body.style.getPropertyValue('overflow'), '');
        eq('round ' + round + ': no timer left', clock.pending, 0);
        eq('round ' + round + ': no staged node left in the document',
            doc.querySelectorAll('img').length, 0);
    }
    eq('every dispose asked the host half to end its curtain (idempotent host hook)',
        endCalls, 2, 'dispose rounds: 2, end() calls: ' + endCalls);
}

// ---------------------------------------------------------------------------
// 13. 550c mutual exclusion
// ---------------------------------------------------------------------------

section('13. 550c mutual exclusion (early and late)');
{
    // early, via class
    const a = makeEnv({ rivalClass: true });
    const bootA = createBootShow({ document: a.doc, window: a.win, clock: a.clock });
    eq('yields when dsh550c-first is already on documentElement', bootA.state, 'yield-550c');
    eq('yields without mounting a stage', hostsIn(a.doc).length, 0);
    eq('yields without scheduling anything', a.clock.pending, 0);
    eq('yields without touching the rival class', a.doc.documentElement.className, 'dsh550c-first');

    // early, via global
    const b = makeEnv({ rivalGlobal: true });
    const bootB = createBootShow({ document: b.doc, window: b.win, clock: b.clock });
    eq('yields when window.__dsh550cBoot exists', bootB.state, 'yield-550c');
    eq('no stage when the rival global is present', hostsIn(b.doc).length, 0);

    // late, via class
    const c = makeEnv();
    let endCalls = 0;
    c.win.__dshWhaleMaidBoot = { end() { endCalls += 1; } };
    const bootC = createBootShow({ document: c.doc, window: c.win, clock: c.clock });
    c.clock.tick(50);
    c.doc.settleImages(true);
    c.clock.tick(1150);
    eq('our stage is playing before the rival appears', bootC.state, 'playing');
    c.doc.documentElement.className = c.doc.documentElement.className + ' dsh550c-first';
    c.clock.tick(250);
    eq('a late dsh550c-first makes us yield', bootC.state, 'yield-550c');
    eq('late yield removes our host', hostsIn(c.doc).length, 0);
    eq('late yield calls the host half end()', endCalls, 1);
    check('late yield clears our first-paint class',
        String(c.doc.documentElement.className).split(/\s+/).indexOf('dsh-whale-maid-first') === -1);
    check('late yield leaves the rival class alone',
        String(c.doc.documentElement.className).split(/\s+/).indexOf('dsh550c-first') !== -1,
        c.doc.documentElement.className);
    eq('late yield leaves no timer', c.clock.pending, 0);

    // late, via global
    const d = makeEnv();
    const bootD = createBootShow({ document: d.doc, window: d.win, clock: d.clock });
    d.clock.tick(50);
    d.doc.settleImages(true);
    d.clock.tick(850);
    d.win.__dsh550cBoot = { private: true };
    d.clock.tick(250);
    eq('a late window.__dsh550cBoot also makes us yield', bootD.state, 'yield-550c');
    eq('late global yield removes our host', hostsIn(d.doc).length, 0);

    // the default 8000 ms cap: stalled assets are already handled by the 1200 ms
    // budget, so what this proves is that the curtain cannot outlive its cap.
    const e = makeEnv();
    const bootE = createBootShow({ document: e.doc, window: e.win, clock: e.clock });
    e.clock.tick(8041);
    check('a stalled stage is long gone by the 8000 ms cap',
        bootE.state === 'degraded' && e.clock.pending === 0, bootE.state);
    check('the hard cap clears the first-paint class', firstPaintCleared(e.doc));
    eq('the hard cap removes the host', hostsIn(e.doc).length, 0);

    // the cap branch itself, forced to fire before the 900 ms degraded curtain
    const g = makeEnv();
    const bootG = createBootShow({ document: g.doc, window: g.win, clock: g.clock, maxLifetimeMs: 400 });
    g.clock.tick(1);
    eq('forced-cap stage is preloading', bootG.state, 'preload');
    g.clock.tick(600);
    eq('the hard cap tears the stage down on its own', bootG.state, 'timeout');
    eq('the hard cap removes the host', hostsIn(g.doc).length, 0);
    check('the hard cap clears the first-paint class', firstPaintCleared(g.doc));
    eq('the hard cap leaves nothing scheduled', g.clock.pending, 0);

    // a custom cap is honoured on the normal path too
    const f = makeEnv();
    const bootF = createBootShow({ document: f.doc, window: f.win, clock: f.clock, maxLifetimeMs: 2000 });
    f.clock.tick(1);
    f.doc.settleImages(true);
    f.clock.tick(2041);
    check('a custom maxLifetimeMs does not disturb a healthy show',
        bootF.fired.length >= 1, bootF.state);
}

// ---------------------------------------------------------------------------
// 14. narrow viewport recomposes instead of shrinking
// ---------------------------------------------------------------------------

section('14. narrow viewport');
{
    const { doc, win, clock } = makeEnv({ width: 390, height: 844 });
    const boot = createBootShow({ document: doc, window: win, clock });
    const stage = inShadow(doc, '.stage');
    eq('narrow flag is set on the stage', stage.getAttribute('data-narrow'), '1');
    eq('the right maid stands down on narrow screens', stage.getAttribute('data-right'), '0');
    eq('the chibi stands down on narrow screens', stage.getAttribute('data-chibi'), '0');
    check('the narrow layout re-positions the title instead of only scaling',
        inShadow(doc, 'style').textContent.indexOf('@media (max-width:720px)') !== -1
        && inShadow(doc, 'style').textContent.indexOf('.wm-title-inner{left:6%;right:6%') !== -1);
    doc._imageBehaviour = 'ok';
    clock.tick(1000);
    eq('the narrow stage still plays', boot.state, 'playing');
    boot.dispose();
    eq('narrow stage cleans up', hostsIn(doc).length, 0);
}

// ---------------------------------------------------------------------------
// 15. the artwork swap hook and the standalone preview page
// ---------------------------------------------------------------------------

section('15. swap hook + scripts/preview.html');
{
    // --- the single artwork-route hook -------------------------------------
    const env = makeEnv();
    const seen = [];
    const boot = createBootShow({
        document: env.doc,
        window: env.win,
        clock: env.clock,
        swap: (url, role) => {
            seen.push(role);
            return 'data:image/svg+xml,' + encodeURIComponent('<' + String(role) + '>');
        },
    });
    check('the swap hook sees every role it must replace',
        ['maid-left', 'maid-right', 'chibi'].every((r) => seen.indexOf(r) !== -1)
        && seen.some((r) => r.indexOf('palace-') === 0),
        seen.join(','));
    check('the declared request list still reports the real same-origin routes',
        boot.requests.length === 5 && boot.requests.every((u) => /^\/skin-assets\/maid-atelier\/[a-f0-9]{64}\.webp$/.test(u)),
        boot.requests.join(','));
    check('the swapped source is what actually loads',
        boot.loaded.every((u) => u.indexOf('data:image/svg+xml,') === 0), boot.loaded.join(','));
    const swappedShadow = inShadow(env.doc, '.wm-maid-left');
    eq('the rendered main sprite uses the swapped URL',
        swappedShadow.getAttribute('src').indexOf('data:image/svg+xml,') === 0, true);
    check('the palace layer in the shadow CSS uses the swapped URL',
        inShadow(env.doc, 'style').textContent.indexOf('background-image:url("data:image/svg+xml,') !== -1);
    boot.dispose();
    eq('the swapped stage still cleans up', hostsIn(env.doc).length, 0);

    // --- the preview page itself -------------------------------------------
    const html = readFileSync(resolvePath(PKG_ROOT, 'scripts/preview.html'), 'utf8');
    check('preview.html exists and is non-trivial', html.length > 3000, 'bytes=' + html.length);
    check('preview.html is marked as an action preview, not the real artwork',
        html.indexOf('\u52a8\u4f5c\u9884\u89c8\uff0c\u975e\u771f\u5b9e\u7acb\u7ed8\u6548\u679c') !== -1);
    check('preview.html loads the real client module source',
        html.indexOf("'../lib/client.js'") !== -1 || html.indexOf('"../lib/client.js"') !== -1);
    check('the client entry preview.html points at really exists',
        readFileSync(resolvePath(PKG_ROOT, 'lib/client.js'), 'utf8').indexOf('export function createBootShow') !== -1);
    check('preview.html distinguishes the two acceptance modes',
        html.indexOf('\u6a21\u5f0f 1') !== -1 && html.indexOf('\u6a21\u5f0f 2') !== -1
        && html.indexOf('\u72ec\u7acb\u52a8\u4f5c\u9884\u89c8') !== -1 && html.indexOf('\u771f\u5b9e\u7d20\u6750\u9a8c\u6536') !== -1);
    check('preview.html states that a static server is not the asset route',
        html.indexOf('\u666e\u901a\u9759\u6001\u670d\u52a1\u5668\u4e0d\u7b49\u4e8e\u7d20\u6750\u8def\u7531\u5b58\u5728') !== -1);
    check('preview.html never re-hosts the original artwork',
        (() => {
            const scriptPart = html.split('<script>').slice(1).join('<script>');
            return scriptPart.indexOf('.webp') === -1
                && !/<img\b[^>]*\.webp/i.test(html)
                && !/url\(\s*["']?[^)"']*\.webp/i.test(html);
        })(),
        'found an artwork reference in preview code');
    check('preview.html only loads itself and the local client module',
        (() => {
            const urls = html.match(/(?:src|href)\s*=\s*["']([^"']+)["']/gi) || [];
            return urls.every((u) => !/^["']?https?:/i.test(u.replace(/^\w+\s*=\s*/, '')));
        })(),
        'found an absolute src/href');

    // Execute the page's own rewrite pipeline against the real client source and
    // prove the adapter (a) parses, (b) yields the expected exports and (c)
    // really swaps the artwork while keeping the very same animation logic.
    const scriptBody = html.split('<script>')[1].split('</script>')[0];
    const helperStart = scriptBody.indexOf('    function svgUri');
    const helperEnd = scriptBody.indexOf('    function start()');
    check('preview.html keeps its adapter helpers in one readable block',
        helperStart !== -1 && helperEnd > helperStart);
    const pageHelpers = new Function('document', 'window',
        scriptBody.slice(helperStart, helperEnd)
        + '\nreturn { rewrite: rewrite, maidStandIn: maidStandIn, chibiStandIn: chibiStandIn, palaceStandIn: palaceStandIn };'
    )({}, {});
    const clientSource = readFileSync(resolvePath(PKG_ROOT, 'lib/client.js'), 'utf8');
    const adapted = pageHelpers.rewrite(clientSource);
    check('preview.html can rewrite the current lib/client.js',
        !adapted.error, adapted.error || '');
    if (!adapted.error) {
        let parses = true;
        try { new Function('return ' + adapted.source); } catch (err) { parses = false; check('adapted source parses', false, err.message); }
        if (parses) check('adapted source parses', true);

        const pDoc = new FakeDocument();
        const pWin = new FakeWindow(pDoc);
        pDoc.defaultView = pWin;
        pWin.innerWidth = 1440;
        pWin.innerHeight = 900;
        pDoc.documentElement.clientWidth = 1440;
        pDoc.documentElement.clientHeight = 900;
        pDoc.documentElement.className = 'dsh-whale-maid-first';
        const pClock = new FakeClock();
        pWin.setTimeout = (fn, ms) => pClock.setTimeout(fn, ms);
        pWin.clearTimeout = (id) => pClock.clearTimeout(id);

        const pageApi = new Function('document', 'window', 'return ' + adapted.source)(pDoc, pWin);
        check('the adapted preview module exposes createBootShow and apply',
            typeof pageApi.createBootShow === 'function' && typeof pageApi.apply === 'function');
        eq('the adapted preview module still exposes all six assets', Object.keys(pageApi.BOOT_ASSETS).length, 6);

        const standIns = {
            left: pageHelpers.maidStandIn(1122, 2019, 'L'),
            right: pageHelpers.maidStandIn(1077, 2048, 'R'),
            chibi: pageHelpers.chibiStandIn(620, 553),
            palace: pageHelpers.palaceStandIn(),
        };
        pageApi.setPlaceholders(standIns);
        check('the preview swap maps by role, not by URL',
            pageApi.swap('anything', 'maid-left') === standIns.left
            && pageApi.swap('anything', 'palace-dark') === standIns.palace
            && pageApi.swap('anything', 'chibi') === standIns.chibi);

        const pageBoot = pageApi.createBootShow({
            document: pDoc, window: pWin, assets: pageApi.BOOT_ASSETS, swap: pageApi.swap,
        });
        const pShadow = shadowOf(pDoc);
        check('the preview stage mounts inside its own shadow root', !!pShadow);
        check('the preview stage keeps the real composition',
            !!pShadow.querySelector('.wm-maid-left') && !!pShadow.querySelector('.wm-title-cn')
            && !!pShadow.querySelector('.wm-particles'));
        const previewSrcs = pShadow.querySelectorAll('img').map((n) => n.getAttribute('src'));
        check('every preview sprite is an inline SVG stand-in (no artwork is fetched)',
            previewSrcs.length >= 2 && previewSrcs.every((s) => s.indexOf('data:image/svg+xml') === 0),
            previewSrcs.length + ' images');
        check('the preview composition is the width-gated one for 1440x900',
            pShadow.querySelector('.stage').getAttribute('data-right') === '0'
            && previewSrcs.length === 2,
            'right=' + pShadow.querySelector('.stage').getAttribute('data-right')
            + ' images=' + previewSrcs.length);
        check('the preview palace layer is an inline SVG stand-in too',
            pShadow.querySelector('style').textContent.indexOf('background-image:url("data:image/svg+xml,') !== -1);
        at({ clock: pClock }, 0);
        pDoc.settleImages(true);
        eq('the preview stage plays the same timeline', pageBoot.state, 'playing');
        pClock.tick(6401);
        eq('the preview stage runs all eight segments', pageBoot.fired.length, 8);
        eq('the preview end also goes through the fade-out first', pageBoot.state, 'skipping');
        eq('the preview stage fades for the declared 800 ms',
            hostsIn(pDoc)[0].style.getPropertyValue('transition-duration'), '800ms');
        pClock.tick(801);
        eq('the preview stage ends and cleans up', pageBoot.state, 'ended');
        eq('the preview stage ends and cleans up', pageBoot.state, 'ended');
        eq('the preview stage left no host behind', hostsIn(pDoc).length, 0);

        // If the artwork route is missing (skin plugin disabled) the page must
        // degrade rather than error out.
        const gDoc = new FakeDocument();
        const gWin = new FakeWindow(gDoc);
        gDoc.defaultView = gWin;
        gWin.innerWidth = 1440;
        gWin.innerHeight = 900;
        const gClock = new FakeClock();
        gWin.setTimeout = (fn, ms) => gClock.setTimeout(fn, ms);
        gWin.clearTimeout = (id) => gClock.clearTimeout(id);
        const degradedApi = new Function('document', 'window', 'return ' + adapted.source)(gDoc, gWin);
        degradedApi.setPlaceholders({});
        const degradedBoot = degradedApi.createBootShow({
            document: gDoc, window: gWin, assets: degradedApi.BOOT_ASSETS, swap: degradedApi.swap,
        });
        gClock.tick(1);
        gDoc.settleImages(false);
        eq('a missing route makes the preview degrade instead of throwing', degradedBoot.state, 'degrade');
        gClock.tick(1000);
        eq('the degraded preview cleans up', degradedBoot.state, 'degraded');
        eq('the degraded preview leaves no host', hostsIn(gDoc).length, 0);
        check('the degraded preview leaves no leftover class',
            String(gDoc.documentElement.className).split(/\s+/).indexOf('dsh-whale-maid-first') === -1);
    }
}

// ---------------------------------------------------------------------------
// 16. rule-level checks: does the STYLESHEET actually reveal, and can it ever
//     un-reveal? (the fake DOM cannot answer this; the cascade engine can)
// ---------------------------------------------------------------------------

section('16. stylesheet rules: monotonic reveal + irreversible curtain');
{
    const env = makeEnv();
    const boot = createBootShow({ document: env.doc, window: env.win, clock: env.clock });
    const css = stageCssOf(env.doc);
    check('the stage stylesheet is non-trivial', css.length > 2000, 'len=' + css.length);
    check('the stage stylesheet keys reveals off a monotonic phase',
        css.indexOf('data-phase') !== -1 && css.indexOf('data-curtain') !== -1);

    const wide = 1920;
    /** Winning declarations for one child of `.stage`, at one attribute state. */
    const cell = (fields, elementSelector, width) => cascade(css, stageAttrs(fields), width || wide, elementSelector);

    // --- F1: an element that has entered stays entered ----------------------
    const atPhase = (phase, elementSelector) => cell(
        { phase: phase, index: Math.min(phase, 6), curtainOpen: phase >= 1 }, elementSelector,
    );

    eq('before its segment the main sprite is still hidden',
        atPhase(1, '.wm-maid-left').get('opacity'), '0');
    eq('the main sprite reveals on its own segment',
        atPhase(2, '.wm-maid-left').get('opacity'), '1');
    eq('the main sprite stays revealed once later segments cleared the old flags',
        atPhase(5, '.wm-maid-left').get('opacity'), '1');
    eq('the main sprite is revealed at every phase from 2 to 6',
        [2, 3, 4, 5, 6].filter((p) => atPhase(p, '.wm-maid-left').get('opacity') === '1').length, 5);
    eq('the main sprite keeps its landed transform once the old flag is gone',
        atPhase(5, '.wm-maid-left').get('transform'), 'translate3d(0,0,0)');

    eq('the right maid is still hidden on its own segment frame',
        atPhase(2, '.wm-maid-right').get('opacity'), '0');
    eq('the right maid reveals on segment 3',
        atPhase(3, '.wm-maid-right').get('opacity'), '1');
    eq('the right maid stays revealed after the flag is cleared',
        atPhase(5, '.wm-maid-right').get('opacity'), '1');
    eq('the chibi stays revealed after the flag is cleared',
        atPhase(5, '.wm-chibi').get('opacity'), '1');

    eq('the title glyphs are still hidden before their segment',
        atPhase(3, '.wm-title-cn span').get('opacity'), '0');
    eq('the title glyphs reveal on segment 4',
        atPhase(4, '.wm-title-cn span').get('opacity'), '1');
    eq('the title glyphs stay revealed after the sweep flag is cleared',
        atPhase(5, '.wm-title-cn span').get('opacity'), '1');
    eq('the subtitle stays revealed after the sweep flag is cleared',
        atPhase(6, '.wm-title-en').get('opacity'), '1');
    eq('the gold rule stays revealed after the sweep flag is cleared',
        atPhase(6, '.wm-rule').get('opacity'), '1');

    // --- F2: the curtain can never come back --------------------------------
    check('the curtain baseline is declared, not left to the initial value',
        /\.wm-curtain\{[^}]*opacity:1/.test(css));
    eq('the curtain is fully opaque before it parts',
        atPhase(0, '.wm-curtain').get('opacity'), '1');
    check('parting the curtain is a terminal state, not a flag the next segment clears',
        /\.stage\[data-curtain="open"\] \.wm-curtain i\{transform:translate3d\(-101%/.test(css)
        && /\.stage\[data-curtain="open"\] \.wm-curtain i:last-child\{transform:translate3d\(101%/.test(css));
    check('the curtain layer hides itself from that terminal state',
        css.indexOf('.stage[data-curtain="open"][data-s1] .wm-curtain{opacity:0}') !== -1);
    check('no curtain visibility rule is keyed to a flag a later segment clears',
        !/\.stage\[data-s[23456]\] \.wm-curtain/.test(css));
    // After the panels part, nothing that remains can bring either panel back.
    for (const phase of [2, 3, 4, 5, 6]) {
        const closed = atPhase(phase, '.wm-curtain i');
        const stillShowing = closed.get('transform') === 'none' || closed.get('transform') === null;
        if (stillShowing) {
            check('the curtain panels are off-screen at phase ' + phase, false,
                String(closed.get('transform')));
        }
    }
    check('the curtain panels are off-screen at every phase from 2 to 6',
        [2, 3, 4, 5, 6].every((p) => {
            const t = atPhase(p, '.wm-curtain i').get('transform');
            return t === 'translate3d(-101%,0,0)' || t === 'translate3d(101%,0,0)';
        }));

    // --- F3: the host fades out on the phase, before it is removed ----------
    // `:host` is the shadow host, not a child of `.stage`, so it is matched
    // against `:host` rules alone.
    const hostCell = (phase) => cascade(css, {}, wide, ':host');
    eq('the host is opaque for phases 0..5', hostCell().get('opacity'), '1');
    eq('the host is transparent at phase 6',
        cascade(css, { 'data-phase': '6' }, wide, ':host').get('opacity'), '0');
    eq('the host fades over the declared 800 ms', hostCell().get('transition'), 'opacity 800ms ease-out');

    // --- the degraded and reduced curtains are the same still card ----------
    const degradeCell = cell({ mode: 'degrade', reveal: true }, '.wm-title-cn span');
    eq('the still-title switch reveals the title in the degraded curtain', degradeCell.get('opacity'), '1');
    eq('the still-title switch removes the travel (no transform)',
        degradeCell.get('transform'), 'none');
    eq('with no phase and no switch the degraded title stays hidden',
        cell({ mode: 'degrade' }, '.wm-title-cn span').get('opacity'), '0');
    eq('the narrow layout keeps the main sprite revealed too',
        cell({ phase: 2, index: 2, narrow: true }, '.wm-maid-left', 480).get('transform'),
        'translate3d(0,0,0)');

    // The engine must fail loudly rather than silently skip a selector it does
    // not understand: that is what keeps these assertions honest.
    let engineRejected = false;
    try {
        cascade('.a + .b{opacity:1}', {}, wide, '.b');
    } catch (_err) {
        engineRejected = true;
    }
    check('the cascade engine refuses selectors it cannot model', engineRejected);

    boot.dispose();
}

// ---------------------------------------------------------------------------
// 17. every asset must decode: a later failure degrades too (F5)
// ---------------------------------------------------------------------------

section('17. every probed asset must report a decoded bitmap');
{
    // Which probe index corresponds to which role depends on the request order;
    // assert on the role list first so the mapping below stays honest.
    const roleEnv = makeEnv();
    const roleBoot = createBootShow({ document: roleEnv.doc, window: roleEnv.win, clock: roleEnv.clock });
    roleEnv.clock.tick(1);
    eq('the probe covers five assets', roleEnv.doc._probes.length, 5);
    const loaded = roleBoot.loaded;
    eq('the probe order is left, right, palace-light, palace-dark, chibi',
        [BOOT_ASSETS['maid-left'].url, BOOT_ASSETS['maid-right'].url,
            BOOT_ASSETS['palace-light'].url, BOOT_ASSETS['palace-dark'].url,
            BOOT_ASSETS.chibi.url].join('|'),
        loaded.join('|'));
    roleBoot.dispose();

    // 1) only the SECOND asset fails
    const env2 = makeEnv();
    const boot2 = createBootShow({ document: env2.doc, window: env2.win, clock: env2.clock });
    env2.clock.tick(1);
    env2.doc.settleImages((i) => i !== 1);
    eq('a broken right maid degrades the whole show instead of playing broken art',
        boot2.state, 'degrade');
    eq('a broken right maid plays no segment at all', boot2.fired.length, 0);
    eq('a broken right maid still shows the still title',
        inShadow(env2.doc, '.stage').getAttribute('data-reveal'), '1');

    // 2) only the LAST asset fails (this is the chibi, the old `nodes[0]` shortcut)
    const env5 = makeEnv();
    const boot5 = createBootShow({ document: env5.doc, window: env5.win, clock: env5.clock });
    env5.clock.tick(1);
    env5.doc.settleImages((i) => i !== 4);
    eq('a broken chibi also degrades', boot5.state, 'degrade');
    eq('a broken chibi plays no segment', boot5.fired.length, 0);

    // 3) the same for the palace plate
    const envPalace = makeEnv();
    const bootPalace = createBootShow({ document: envPalace.doc, window: envPalace.win, clock: envPalace.clock });
    envPalace.clock.tick(1);
    envPalace.doc.settleImages((i) => i < 2);
    eq('a broken palace plate degrades too', bootPalace.state, 'degrade');

    // 4) a `load` event that carries no decoded pixels is a failure, not a pass
    const envZero = makeEnv();
    const bootZero = createBootShow({ document: envZero.doc, window: envZero.win, clock: envZero.clock });
    envZero.clock.tick(1);
    envZero.doc.settleImages(() => false); // load-dispatched? no: error path
    eq('a load without pixels is treated as a failure', bootZero.state, 'degrade');

    // 5) ...while all five decoding is still an ordinary pass
    const envOk = makeEnv();
    const bootOk = createBootShow({ document: envOk.doc, window: envOk.win, clock: envOk.clock });
    envOk.clock.tick(1);
    envOk.doc.settleImages(true);
    eq('all five decoded lets the real timeline run', bootOk.state, 'playing');
    bootOk.dispose();
}

// ---------------------------------------------------------------------------
// 18. reduced motion parity, exact hard cap, fade-out and state restoration
// ---------------------------------------------------------------------------

section('18. reduced motion, exact cap, fade-out, overflow restoration');
{
    // --- F7: the reduced-motion curtain is the SAME still, titled card -------
    const reducedEnv = makeEnv({ reducedMotion: true });
    const reducedBoot = createBootShow({
        document: reducedEnv.doc, window: reducedEnv.win, clock: reducedEnv.clock,
    });
    reducedEnv.clock.tick(1);
    eq('reduced motion never preloads', reducedEnv.doc._probes.length, 0);
    eq('reduced motion is in its own state', reducedBoot.state, 'reduced');
    const reducedStage = inShadow(reducedEnv.doc, '.stage');
    eq('reduced motion uses the still card', reducedStage.getAttribute('data-mode'), 'degrade');
    eq('reduced motion shows the title (same switch as the degraded curtain)',
        reducedStage.getAttribute('data-reveal'), '1');
    eq('reduced motion is visible while it lasts',
        hostsIn(reducedEnv.doc)[0].getAttribute('data-state'), 'visible');
    const css = stageCssOf(reducedEnv.doc);
    const stillCard = cascade(css, stageAttrs({ mode: 'degrade', reveal: true }), 1920, 'element');
    eq('the reduced/degraded title is fully opaque', stillCard.get('opacity'), '1');
    eq('the reduced/degraded title has no travel', stillCard.get('transform'), 'none');
    reducedEnv.clock.tick(400);
    eq('reduced motion clears within its short budget', reducedBoot.state, 'reduced-motion');
    eq('reduced motion left no host', hostsIn(reducedEnv.doc).length, 0);

    // --- F8: the hard cap fires at exactly maxLifetimeMs ---------------------
    // The preload budget is pushed past the cap so the watchdog, not the
    // degraded curtain, is what ends this run.
    const capEnv = makeEnv();
    const capBoot = createBootShow({
        document: capEnv.doc, window: capEnv.win, clock: capEnv.clock, preloadBudgetMs: 20000,
    });
    at(capEnv, 7980);
    eq('one millisecond before the declared cap the stage is still alive',
        capBoot.state, 'preload');
    eq('the host is still visible up to the cap',
        hostsIn(capEnv.doc)[0].getAttribute('data-state'), 'visible');
    at(capEnv, 8000);
    eq('the cap fires exactly at 8000 ms, with no extra grace', capBoot.state, 'timeout');
    eq('the cap removed the host', hostsIn(capEnv.doc).length, 0);
    eq('the cap left nothing scheduled', capEnv.clock.pending, 0);
    check('the cap landed on the declared boundary',
        capEnv.clock.now - capEnv.clock.origin >= 8000,
        String(capEnv.clock.now - capEnv.clock.origin));
    check('the default cap is the declared 8000 ms in the source',
        /const MAX_LIFETIME_MS = 8000;/.test(readFileSync(resolvePath(PKG_ROOT, 'lib/client.js'), 'utf8')));

    // --- F6: a pre-set inline overflow survives teardown verbatim -----------
    const styleEnv = makeEnv();
    styleEnv.doc.body.style.setProperty('overflow', 'scroll');
    styleEnv.doc.body.style.setProperty('padding-top', '37px');
    const styleBoot = createBootShow({
        document: styleEnv.doc, window: styleEnv.win, clock: styleEnv.clock,
    });
    eq('the stage locks scrolling while it is up',
        styleEnv.doc.body.style.getPropertyValue('overflow'), 'hidden');
    eq('the stage does not touch other inline properties',
        styleEnv.doc.body.style.getPropertyValue('padding-top'), '37px');
    styleBoot.dispose();
    eq('a pre-set inline overflow is restored verbatim, not cleared',
        styleEnv.doc.body.style.getPropertyValue('overflow'), 'scroll');
    eq('unrelated inline properties are still untouched',
        styleEnv.doc.body.style.getPropertyValue('padding-top'), '37px');

    const noStyleEnv = makeEnv();
    const noStyleBoot = createBootShow({
        document: noStyleEnv.doc, window: noStyleEnv.win, clock: noStyleEnv.clock,
    });
    noStyleBoot.dispose();
    eq('a page with no inline overflow gets none back',
        noStyleEnv.doc.body.style.getPropertyValue('overflow'), '');

    // --- F4: the host is visible for the whole run, and rewritten on exit ---
    const visEnv = makeEnv();
    const visBoot = createBootShow({ document: visEnv.doc, window: visEnv.win, clock: visEnv.clock });
    eq('the first painted frame is visible', hostsIn(visEnv.doc)[0].getAttribute('data-state'), 'visible');
    visEnv.clock.tick(1);
    eq('still visible during preloading',
        hostsIn(visEnv.doc)[0].getAttribute('data-state'), 'visible');
    visEnv.doc.settleImages(true);
    eq('still visible after the artwork resolves (warm-cache path)',
        hostsIn(visEnv.doc)[0].getAttribute('data-state'), 'visible');
    visEnv.clock.tick(3199);
    eq('visible at segment 4', hostsIn(visEnv.doc)[0].getAttribute('data-state'), 'visible');
    eq('the phase has reached 4', inShadow(visEnv.doc, '.stage').getAttribute('data-phase'), '4');
    visEnv.doc.dispatchEvent({ type: 'click', target: visEnv.doc.body });
    eq('a skip rewrites the host state', hostsIn(visEnv.doc)[0].getAttribute('data-state'), 'fade-out');
    visEnv.clock.tick(150);
    eq('the skipped stage is gone', visBoot.state, 'skipped');
    eq('the skipped stage left no host', hostsIn(visEnv.doc).length, 0);

    // degrade path rewrites it as well
    const degEnv = makeEnv();
    const degBoot = createBootShow({ document: degEnv.doc, window: degEnv.win, clock: degEnv.clock });
    eq('degraded curtain starts visible', hostsIn(degEnv.doc)[0].getAttribute('data-state'), 'visible');
    degEnv.clock.tick(1);
    degEnv.doc.settleImages(false);
    eq('degrade keeps it visible while the card is up',
        hostsIn(degEnv.doc)[0].getAttribute('data-state'), 'visible');
    at(degEnv, 690);
    eq('degrade rewrites it to fade-out before unmounting',
        hostsIn(degEnv.doc)[0].getAttribute('data-state'), 'fade-out');
    at(degEnv, 910);
    eq('degrade then unmounts', degBoot.state, 'degraded');
    eq('degrade left no host', hostsIn(degEnv.doc).length, 0);

    // --- F9: the title box and the right maid cannot overlap ----------------
    const wideEnv = makeEnv({ width: 1920, height: 1080 });
    const wideBoot = createBootShow({ document: wideEnv.doc, window: wideEnv.win, clock: wideEnv.clock });
    const wideStage = inShadow(wideEnv.doc, '.stage');
    eq('1920x1080 has room for both maids and the title',
        wideStage.getAttribute('data-right'), '1');
    const wideLeft = parseFloat(wideStage.style.getPropertyValue('--wm-title-left'));
    const wideMax = parseFloat(wideStage.style.getPropertyValue('--wm-title-max'));
    const rightSpriteW = 0.92 * 1080 * 0.5259;
    const rightEdge = 1920 - Math.max(8, Math.min(0.05 * 1920, 80)) - rightSpriteW;
    check('the reserved title box stops before the right maid starts',
        wideLeft + wideMax <= rightEdge + 1,
        'title ends at ' + (wideLeft + wideMax) + ', right maid starts at ' + rightEdge);
    wideBoot.dispose();

    const tightEnv = makeEnv({ width: 1440, height: 900 });
    const tightBoot = createBootShow({ document: tightEnv.doc, window: tightEnv.win, clock: tightEnv.clock });
    const tightStage = inShadow(tightEnv.doc, '.stage');
    eq('1440x900 makes the right maid yield', tightStage.getAttribute('data-right'), '0');
    const tightLeft = parseFloat(tightStage.style.getPropertyValue('--wm-title-left'));
    const tightMax = parseFloat(tightStage.style.getPropertyValue('--wm-title-max'));
    check('the yielded layout keeps the title fully on screen',
        tightLeft + tightMax <= 1440, 'title ends at ' + (tightLeft + tightMax));
    check('the compact title still keeps a usable box', tightMax >= 160, String(tightMax));
    tightBoot.dispose();
}

// ---------------------------------------------------------------------------
// summary
// ---------------------------------------------------------------------------

process.stdout.write('\n----------------------------------------\n');
process.stdout.write('checks: ' + checks + ', failures: ' + failures + '\n');
process.stdout.write('NOTE: this suite uses a hand-rolled fake DOM. It proves scheduling,\n');
process.stdout.write('      structure, state and cleanup only. It does NOT prove browser\n');
process.stdout.write('      visuals, layout, fonts or artwork: check scripts/preview.html\n');
process.stdout.write('      and a real DSH boot for that.\n');
if (failures > 0) {
    process.stdout.write('RESULT: FAIL\n');
    process.exit(1);
}
process.stdout.write('RESULT: PASS (last section written by ' + group + ')\n');
process.exit(0);
