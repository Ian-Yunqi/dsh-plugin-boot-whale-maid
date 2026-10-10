/**
 * dsh-plugin-boot-whale-maid — the Web client half.
 *
 * Stage-style boot animation for DSH: a full-screen shadow-root stage mounts
 * over the host half's first-paint curtain, plays an 8-segment timeline seeded
 * by an explicit segment table, then fades the whole stage out to reveal the
 * real interface. Click or Escape skips it; a skip finishes within 150 ms.
 *
 * Isolation: every node and every rule lives inside the host element's own
 * open shadow root. The main document receives exactly this plugin's host
 * element, its first-paint class (`dsh-whale-maid-first`, owned by the host
 * half, only ever *removed* here) and nothing else.
 *
 * Safety: the worst possible outcome is "no animation". The module top level
 * never touches `window`/`document` — all DOM access happens inside `apply(ctx)`
 * or inside `createBootShow()`. Every failure path runs through one idempotent
 * teardown, so a late callback can never re-mount the curtain.
 *
 * Artwork: original pixel sizes come from docs/assets.json (WebP headers only:
 * left 1122x2019 -> 0.5557, right 1077x2048 -> 0.5259, chibi 620x553, palace
 * 1586x992). Sprites are sized from the stage HEIGHT with `width:auto` and
 * `object-fit:contain`, so the source art is never stretched, cropped at the
 * face, mirrored or redrawn. `vision` is deliberately unused: it is the
 * flash-perspective variant of the right maid (default `opacity:0`).
 *
 * @module dsh-plugin-boot-whale-maid/client
 */

/** Client services this half needs before `apply` runs. */
export const inject = [];

/** First-paint class owned by the host half (removed, never added, here). */
const FIRST_PAINT_CLASS = 'dsh-whale-maid-first';
/** Host element class used to find/remove a leftover stage. */
const BOOT_HOST_SELECTOR = '.dsh-whale-maid-boot-host';
/** Mutual-exclusion markers of the dsh-550c-boot plugin. */
const RIVAL_CLASS = 'dsh550c-first';
const RIVAL_GLOBAL = '__dsh550cBoot';

/**
 * Same-origin artwork URLs, verbatim from docs/assets.json.
 * Served by the maid-atelier skin plugin's own `/skin-assets/maid-atelier/`
 * route — never copied, never re-hosted, never a local filesystem path.
 */
export const BOOT_ASSETS = Object.freeze({
    'maid-left': Object.freeze({
        hash: '2818e5359596b13c5d64f5b1c5d4a9e0c05be477824779af8af37a0e10016b07',
        url: '/skin-assets/maid-atelier/2818e5359596b13c5d64f5b1c5d4a9e0c05be477824779af8af37a0e10016b07.webp',
        width: 1122,
        height: 2019,
        ratio: 0.5557,
        used: true,
    }),
    'maid-right': Object.freeze({
        hash: '7c5a5493e84418bc0435013c8605222718923872c15eb46fdd36158d201c0b1e',
        url: '/skin-assets/maid-atelier/7c5a5493e84418bc0435013c8605222718923872c15eb46fdd36158d201c0b1e.webp',
        width: 1077,
        height: 2048,
        ratio: 0.5259,
        used: true,
    }),
    'palace-light': Object.freeze({
        hash: '52e7dce6993e3f955c3fbb2875885e7ab60fb38ca89adb15d977c7a85d58c073',
        url: '/skin-assets/maid-atelier/52e7dce6993e3f955c3fbb2875885e7ab60fb38ca89adb15d977c7a85d58c073.webp',
        width: 1586,
        height: 992,
        ratio: 1.5988,
        used: true,
    }),
    'palace-dark': Object.freeze({
        hash: 'ae6917bb1aafa71e6a10cfcaa1289f13e265aa7f32d3fb7c1988004bf50f8983',
        url: '/skin-assets/maid-atelier/ae6917bb1aafa71e6a10cfcaa1289f13e265aa7f32d3fb7c1988004bf50f8983.webp',
        width: 1586,
        height: 992,
        ratio: 1.5988,
        used: true,
    }),
    'chibi': Object.freeze({
        hash: '405917afdb68d725624bbf7e4f1619a35fc4004039b7d553c5528ca5f65308d3',
        url: '/skin-assets/maid-atelier/405917afdb68d725624bbf7e4f1619a35fc4004039b7d553c5528ca5f65308d3.webp',
        width: 620,
        height: 553,
        ratio: 1.1212,
        used: true,
    }),
    'vision': Object.freeze({
        hash: '98cf9484ee96018b1ddc6d61f30945ce973158002fe31a2be0790e44c6718515',
        url: '/skin-assets/maid-atelier/98cf9484ee96018b1ddc6d61f30945ce973158002fe31a2be0790e44c6718515.webp',
        width: 1394,
        height: 2649,
        ratio: 0.5262,
        // Deliberately neither preloaded nor rendered: flash-perspective variant.
        used: false,
    }),
});

/** Stage layout + timing parameters, kept in one place so they stay tunable. */
export const STAGE_CONFIG = Object.freeze({
    /** Stage width threshold for the narrow layout, in px. */
    narrowPx: 720,
    /** Main sprite height as a fraction of the stage height. */
    maidLeftHeight: '0.96',
    /** Right maid height, used only when the wide layout has room. */
    maidRightHeight: '0.92',
    /** Chibi height as a fraction of the stage height (12%-18% band). */
    chibiHeight: '0.15',
    /** Stage heights below which the right maid and the chibi stand down. */
    rightMaidMinPx: 620,
    chibiMinPx: 520,
    /** Side-by-side width budget: 0.96*0.5557 + 0.92*0.5259 = 1.0173, +32px. */
    twoMaidWidthFactor: 1.0173,
    twoMaidGapPx: 32,
    /** Cap on the reserved title box, in px. */
    titleMaxPx: 620,
    /** Title reveal cadence. */
    charStepMs: 70,
    charRisePx: 10,
    /** Skip must reach the finished state within this budget. */
    skipFadeMs: 140,
});

/** Default asset preload budget, in ms. */
const PRELOAD_BUDGET_MS = 1200;
/** Degraded curtain total lifetime, in ms (must stay under 1000 ms). */
const DEGRADE_TOTAL_MS = 900;
/** Reduced-motion fallback curtain lifetime, in ms (no movement at all). */
const REDUCED_FALLBACK_MS = 320;
/** Hard cleanup of the host half's curtain, counted from first paint. */
const MAX_LIFETIME_MS = 8000;
/** Cadence of the late-arriving-550c watchdog. */
const RIVAL_POLL_MS = 250;
/** Fade-out duration used by the fade-out segment and by every teardown. */
const FADE_OUT_MS = 800;
/** Upper bound of the reserved title box, in px. */
const TITLE_MAX_PX = STAGE_CONFIG.titleMaxPx;

/**
 * The explicit segment table that drives the show.
 *
 * Times are absolute milliseconds on the stage clock and are exactly the second
 * field of the `at` pair, so a fake clock can record them one by one:
 * 0.0 / 0.5 / 1.8 / 2.05 / 3.2 / 4.4 / 5.6 / 6.4 s.
 */
export const BOOT_SEGMENTS = Object.freeze([
    Object.freeze({ index: 0, id: 'curtain-rise', at: 0, end: 500, label: '黑色起幕 / 深海蓝径向光缓亮' }),
    Object.freeze({ index: 1, id: 'curtain-open', at: 500, end: 1800, label: '左右幕布平稳分开露出宫殿' }),
    Object.freeze({ index: 2, id: 'maid-left-enter', at: 1800, end: 3200, label: '主立绘左下短距滑入落位' }),
    Object.freeze({ index: 3, id: 'maid-right-enter', at: 2050, end: 3200, label: '右 Q 版延后 0.25s 小幅进入' }),
    Object.freeze({ index: 4, id: 'title-reveal', at: 3200, end: 4400, label: '中文逐字浮现 + 英文淡入 + 一次暖金扫光' }),
    Object.freeze({ index: 5, id: 'lace-tail', at: 4400, end: 5600, label: '蕾丝光点横扫 + 鲸尾剪影游过（人物之后）' }),
    Object.freeze({ index: 6, id: 'stage-fade-out', at: 5600, end: 6400, label: '舞台整体渐出露出真实界面' }),
    Object.freeze({ index: 7, id: 'finished', at: 6400, end: 6400, label: '结束态与幂等清理' }),
]);

/**
 * Which palace plate to use, as an asset-table key (dark theme -> palace-dark).
 * Decided without touching `window.matchMedia` unguarded, so the whole stage
 * stays testable under a fake DOM.
 */
function pickPalaceRole(doc) {
    let dark = false;
    try {
        const win = doc && doc.defaultView;
        if (win && typeof win.matchMedia === 'function') {
            const mq = win.matchMedia('(prefers-color-scheme: dark)');
            dark = !!(mq && mq.matches);
        }
    } catch (_err) { dark = false; }
    if (!dark) {
        try {
            const root = doc && doc.documentElement;
            if (root && typeof root.hasAttribute === 'function' && root.hasAttribute('data-ds-dark-theme')) dark = true;
        } catch (_err) { dark = false; }
    }
    return dark ? 'palace-dark' : 'palace-light';
}

/** True when the 550c boot plugin already owns (or now claims) the first paint. */
function rivalActive(win, doc) {
    try {
        if (win && win[RIVAL_GLOBAL]) return true;
    } catch (_err) { /* ignore */ }
    try {
        const root = doc && doc.documentElement;
        if (!root) return false;
        if (root.classList && typeof root.classList.contains === 'function') {
            return root.classList.contains(RIVAL_CLASS);
        }
        const cn = typeof root.className === 'string' ? root.className : '';
        return cn.split(/\s+/).indexOf(RIVAL_CLASS) !== -1;
    } catch (_err) {
        return false;
    }
}

/** Read `prefers-reduced-motion` without ever throwing on a partial window. */
function detectReducedMotion(win, doc) {
    try {
        const target = win || (doc && doc.defaultView);
        if (target && typeof target.matchMedia === 'function') {
            const mq = target.matchMedia('(prefers-reduced-motion: reduce)');
            // An unstubbed media query in a minimal double reads falsy, which is
            // the right default: play the show.
            if (mq && mq.matches) return true;
        }
    } catch (_err) { /* ignore */ }
    return false;
}

/**
 * Reduce a requested CSS string to declarations when the document only
 * understands a scalar `style.cssText`. Used by test doubles only; real
 * documents take the property path untouched.
 */
function scalarCss(css) {
    const out = [];
    const steps = String(css).split(';');
    for (let i = 0; i < steps.length; i += 1) {
        const decl = steps[i];
        if (!decl || decl.indexOf('{') !== -1 || decl.indexOf('}') !== -1) continue;
        out.push(decl.trim());
    }
    return out.join('; ');
}

/**
 * The shadow-root stylesheet. Everything is scoped inside the shadow root; no
 * selector here can match a main-document node.
 *
 * Motion policy: decelerating easings only (`--wm-ease-out`), no springs, no
 * bounces, no continuous swaying. The only "life" after landing is one very
 * slow, very small breathing translation.
 */
function stageCss(palaceUrl) {
    return [
        ':host{all:initial;display:block;position:fixed;inset:0;z-index:2147483000;',
        'opacity:0;transition:opacity ' + FADE_OUT_MS + 'ms ease-out}',
        // `visible` matches `data-phase` 1..5; the explicit phase rule below is
        // what actually drives the fade-out, so a late `visible` write can never
        // re-show a stage that is on its way out.
        ':host([data-state="visible"]){opacity:1}',
        ':host([data-state="fade-out"]){opacity:0}',
        ':host([data-phase="0"]),:host([data-phase="1"]),:host([data-phase="2"]),',
        ':host([data-phase="3"]),:host([data-phase="4"]),:host([data-phase="5"]){opacity:1}',
        ':host([data-phase="6"]),:host([data-curtain="open"][data-phase="6"]){opacity:0}',
        '.stage{--wm-navy-deep:#061421;--wm-navy:#123248;--wm-teal:#3d6c7a;--wm-gold:#c8ad73;--wm-ivory:#f2ece0;',
        '--wm-ease-out:cubic-bezier(.16,.84,.28,1);--wm-ease-soft:cubic-bezier(.33,.02,.2,1);',
        'position:absolute;inset:0;overflow:hidden;background:var(--wm-navy-deep);',
        'font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Songti SC","Noto Serif CJK SC",serif;',
        'contain:strict}',
        '.stage [data-layer]{position:absolute;inset:0}',
        /* --- NOTE: every reveal below keys off the MONOTONIC data-phase ------- *
         * `data-phase="N"` means "segment N has happened". Segments only ever    *
         * advance it (setAttribute, never removeAttribute), so nothing that has  *
         * already been revealed can be un-revealed by a later segment. The      *
         * per-segment `data-sN` flags remain, but only as one-shot animation     *
         * triggers for effects that are allowed to finish and fade.            */
        /* --- backdrop: deep-sea floor plus the first-paint black curtain --- */
        '.wm-backdrop{background:radial-gradient(120% 78% at 30% 78%,#123248 0%,rgba(18,50,72,0) 62%),',
        'radial-gradient(90% 60% at 72% 26%,rgba(61,108,122,.42) 0%,rgba(61,108,122,0) 70%),',
        'linear-gradient(180deg,#061421 0%,#08182b 58%,#0a1b2e 100%)}',
        '.wm-backdrop::after{content:"";position:absolute;inset:0;opacity:0;background:#040a13;transition:opacity 1300ms ease-out}',
        '.stage[data-s0] .wm-backdrop::after{opacity:1}',
        '.stage[data-phase="0"] .wm-backdrop::after{opacity:1}',
        '.stage[data-phase="1"] .wm-backdrop::after,',
        '.stage[data-phase="2"] .wm-backdrop::after,',
        '.stage[data-phase="3"] .wm-backdrop::after,',
        '.stage[data-phase="4"] .wm-backdrop::after,',
        '.stage[data-phase="5"] .wm-backdrop::after,',
        '.stage[data-phase="6"] .wm-backdrop::after{opacity:0}',
        '.wm-arch{opacity:.72}',
        '.wm-arch span{position:absolute;bottom:0;width:12%;border-radius:48% 48% 0 0/34% 34% 0 0;',
        'background:linear-gradient(180deg,rgba(200,173,115,.16),rgba(200,173,115,.03) 54%,transparent 100%)}',
        '.wm-arch span:nth-child(1){left:4%;height:58%}',
        '.wm-arch span:nth-child(2){left:22%;height:70%}',
        '.wm-arch span:nth-child(3){left:40%;height:50%}',
        '.wm-arch span:nth-child(4){left:58%;height:66%}',
        '.wm-arch span:nth-child(5){left:76%;height:56%}',
        '.wm-glow{background:radial-gradient(52% 40% at 30% 34%,rgba(242,236,224,.16) 0%,rgba(242,236,224,0) 72%)}',
        /* --- palace artwork: cover + center bottom, behind everything --- */
        '.wm-palace{z-index:1;background-image:url("' + palaceUrl + '");',
        'background-position:center bottom;background-size:cover;background-repeat:no-repeat;',
        'filter:brightness(.68) saturate(.9) contrast(1.02)}',
        '.wm-palace::after{content:"";position:absolute;inset:0;',
        'background:radial-gradient(74% 66% at 32% 46%,transparent 0%,rgba(4,10,19,.34) 70%,rgba(4,10,19,.72) 100%)}',
        /* --- whale tail silhouette: behind the maids, one pass only ---------- *
         * An intentional one-shot effect layer: it may fade again after its    *
         * single pass, so it is driven by the (clearable) one-shot flag, not by *
         * the monotonic phase.                                                 */
        '.wm-tail{z-index:2;opacity:0;pointer-events:none}',
        '.stage[data-s5] .wm-tail{opacity:.5;transition:opacity 900ms ease-out}',
        '.wm-tail svg{position:absolute;left:-6%;bottom:22%;width:46%;max-width:820px;height:auto}',
        '.stage[data-s5] .wm-tail svg{animation:wm-tail-swim 1200ms var(--wm-ease-soft) 1 both}',
        '@keyframes wm-tail-swim{from{transform:translate3d(-16%,3%,0)}to{transform:translate3d(62%,-3%,0)}}',
        '.wm-tail path{fill:rgba(10,26,42,.92)}',
        '.wm-tail path:last-child{fill:rgba(61,108,122,.35)}',
        /* --- curtains: CSS/SVG only, cloth depth from shading ---------------- *
         * Irreversible: `data-curtain="open"` is written once when the panels   *
         * start to part and is never cleared, and every "opening has happened"  *
         * rule keys off it or off the monotonic phase. `.wm-curtain` has an     *
         * explicit baseline `opacity:1`; no rule anywhere can bring it back.    */
        '.wm-curtain{z-index:60;pointer-events:none;opacity:1;transition:opacity 260ms ease-out}',
        '.wm-curtain i{position:absolute;top:0;bottom:0;width:54%;',
        'background-image:linear-gradient(90deg,rgba(3,7,14,1) 0%,rgba(6,14,26,1) 46%,rgba(9,20,36,1) 100%),',
        'repeating-linear-gradient(90deg,rgba(255,255,255,.055) 0 6px,rgba(0,0,0,.16) 6px 26px),',
        'repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 5px,rgba(0,0,0,.18) 5px 24px);',
        'background-blend-mode:overlay,normal;box-shadow:0 0 120px rgba(0,0,0,.6) inset;',
        'transition:transform 1300ms var(--wm-ease-soft)}',
        '.stage[data-curtain="open"] .wm-curtain i{transform:translate3d(-101%,0,0)}',
        '.wm-curtain i:last-child{right:0}',
        '.stage[data-curtain="open"] .wm-curtain i:last-child{transform:translate3d(101%,0,0)}',
        '.stage[data-curtain="open"][data-s1] .wm-curtain{opacity:0}',
        /* --- maids: intrinsic ratio only, bottom-anchored, never mirrored --- */
        '.wm-maid{z-index:5;width:auto;height:auto;max-width:none;object-fit:contain;object-position:center bottom;',
        'position:absolute;bottom:0;will-change:transform,opacity}',
        '.wm-maid-left{height:calc(var(--wm-stage-h,100vh) * .96);left:clamp(8px,6%,96px);',
        'opacity:0;transform:translate3d(-9%,4%,0);',
        'transition:transform 1400ms var(--wm-ease-out),opacity 1150ms ease-out}',
        '.stage[data-phase="2"] .wm-maid-left,',
        '.stage[data-phase="3"] .wm-maid-left,',
        '.stage[data-phase="4"] .wm-maid-left,',
        '.stage[data-phase="5"] .wm-maid-left,',
        '.stage[data-phase="6"] .wm-maid-left{opacity:1;transform:translate3d(0,0,0)}',
        /* the one-shot landing breath, keyed off the s3 flag it is started by */
        '.stage[data-s3] .wm-maid-left{animation:wm-breathe 9s ease-in-out 1 forwards}',
        '.wm-maid-right{height:calc(var(--wm-stage-h,100vh) * .92);right:clamp(8px,5%,80px);',
        'opacity:0;transform:translate3d(8%,5%,0);',
        'transition:transform 1150ms var(--wm-ease-out),opacity 950ms ease-out}',
        '.stage[data-phase="3"] .wm-maid-right,',
        '.stage[data-phase="4"] .wm-maid-right,',
        '.stage[data-phase="5"] .wm-maid-right,',
        '.stage[data-phase="6"] .wm-maid-right{opacity:1;transform:translate3d(0,0,0)}',
        /* Q-version mascot: clearly smaller, one modest entrance, no bouncing. */
        '.wm-chibi{position:absolute;height:calc(var(--wm-stage-h,100vh) * .15);width:auto;bottom:1.5%;',
        'right:calc(clamp(8px,5%,80px) + 4%);object-fit:contain;opacity:0;transform:translate3d(10%,6%,0);',
        'transition:transform 1000ms var(--wm-ease-out),opacity 900ms ease-out}',
        '.stage[data-phase="3"] .wm-chibi,',
        '.stage[data-phase="4"] .wm-chibi,',
        '.stage[data-phase="5"] .wm-chibi,',
        '.stage[data-phase="6"] .wm-chibi{opacity:1;transform:translate3d(0,0,0)}',
        '.wm-maid-right,.wm-chibi{display:none}',
        '.stage[data-narrow="0"][data-right="1"] .wm-maid-right{display:block}',
        '.stage[data-narrow="0"][data-chibi="1"] .wm-chibi{display:block}',
        '@keyframes wm-breathe{0%{translate:0 0}50%{translate:0 -6px}100%{translate:0 -2px}}',
        /* --- title block: serif CJK, ivory, restrained gold rule ------------- *
         * Grayscale-safe first: the reveal is opacity-only for the glyphs and   *
         * the rule (the layout is reserved before phase 4, so nothing reflows). *
         * `--wm-title-max` is set from JS: the width the title may occupy so it *
         * never runs under the right maid.                                     */
        '.wm-title{z-index:20;pointer-events:none}',
        '.wm-title-inner{position:absolute;left:var(--wm-title-left,58%);top:47%;',
        'width:min(40vw,var(--wm-title-max,620px));transform:translateY(-50%)}',
        '.wm-title-cn{font-size:clamp(30px,3.7vw,58px);line-height:1.16;color:var(--wm-ivory);',
        'letter-spacing:.1em;white-space:nowrap;text-shadow:0 2px 18px rgba(4,10,19,.7)}',
        '.wm-title-cn span{display:inline-block;opacity:0;transform:translateY(10px);',
        'transition:opacity 680ms ease-out,transform 680ms var(--wm-ease-out)}',
        '.stage[data-phase="4"] .wm-title-cn span,',
        '.stage[data-phase="5"] .wm-title-cn span,',
        '.stage[data-phase="6"] .wm-title-cn span,',
        '.stage[data-reveal="1"] .wm-title-cn span{opacity:1;transform:translateY(0)}',
        '.wm-rule{position:relative;height:5px;margin:clamp(10px,1.4vh,18px) 0 0;opacity:0;',
        'transition:opacity 600ms ease-out}',
        '.stage[data-phase="4"] .wm-rule,',
        '.stage[data-phase="5"] .wm-rule,',
        '.stage[data-phase="6"] .wm-rule,',
        '.stage[data-reveal="1"] .wm-rule{opacity:1}',
        '.wm-rule i{position:absolute;left:0;top:2px;height:1px;width:100%;',
        'background:linear-gradient(90deg,rgba(200,173,115,0),rgba(200,173,115,.85) 12%,rgba(200,173,115,.5) 62%,rgba(200,173,115,0))}',
        '.wm-rule u{position:absolute;left:0;top:0;height:5px;width:26%;opacity:0;',
        'background:linear-gradient(90deg,rgba(242,236,224,0),rgba(242,236,224,.5),rgba(242,236,224,0))}',
        /* the single gold sweep: intentionally one-shot, flag-driven */
        '.stage[data-s4] .wm-rule u{animation:wm-sweep 900ms var(--wm-ease-soft) 260ms 1 both}',
        '@keyframes wm-sweep{from{opacity:0;transform:translate3d(-40%,0,0)}',
        '35%{opacity:.85}to{opacity:0;transform:translate3d(300%,0,0)}}',
        '.wm-title-en{opacity:0;margin-top:.7em;font-size:clamp(10px,1.05vw,15px);letter-spacing:.34em;',
        'color:var(--wm-gold);text-transform:uppercase;transition:opacity 800ms ease-out}',
        '.stage[data-phase="4"] .wm-title-en,',
        '.stage[data-phase="5"] .wm-title-en,',
        '.stage[data-phase="6"] .wm-title-en,',
        '.stage[data-reveal="1"] .wm-title-en{opacity:1;transition-delay:420ms}',
        /* --- lace light points: a handful, one clear diagonal, behind the maid --- */
        '.wm-particles{z-index:4;pointer-events:none}',
        '.wm-particles g{position:absolute;width:9px;height:9px;margin:-4px 0 0 -4px;border-radius:50%;',
        'background:radial-gradient(circle,rgba(242,236,224,.95) 0%,rgba(200,173,115,.5) 42%,rgba(200,173,115,0) 100%);',
        'opacity:0;box-shadow:0 0 10px rgba(200,173,115,.35)}',
        '.stage[data-s5] .wm-particles g{animation:wm-drift 1120ms linear 1 both}',
        '.wm-particles g:nth-child(1){left:6%;top:72%;animation-delay:0ms}',
        '.wm-particles g:nth-child(2){left:14%;top:64%;animation-delay:40ms}',
        '.wm-particles g:nth-child(3){left:23%;top:57%;animation-delay:80ms}',
        '.wm-particles g:nth-child(4){left:32%;top:50%;animation-delay:120ms}',
        '.wm-particles g:nth-child(5){left:41%;top:44%;animation-delay:160ms}',
        '.wm-particles g:nth-child(6){left:50%;top:39%;animation-delay:200ms}',
        '.wm-particles g:nth-child(7){left:59%;top:35%;animation-delay:240ms}',
        '.wm-particles g:nth-child(8){left:68%;top:31%;animation-delay:280ms}',
        '.wm-particles g:nth-child(9){left:77%;top:28%;animation-delay:320ms}',
        '@keyframes wm-drift{0%{opacity:0;transform:translate3d(0,0,0) scale(.8)}',
        '18%{opacity:.9}72%{opacity:.7}100%{opacity:0;transform:translate3d(16vw,-3vh,0) scale(1)}}',
        /* --- degraded / reduced curtain: text only, shorter, zero movement --- */
        '.stage[data-mode="degrade"] .wm-palace,',
        '.stage[data-mode="degrade"] .wm-maid,',
        '.stage[data-mode="degrade"] .wm-chibi,',
        '.stage[data-mode="degrade"] .wm-tail,',
        '.stage[data-mode="degrade"] .wm-particles,',
        '.stage[data-mode="degrade"] .wm-curtain,',
        '.stage[data-mode="degrade"] .wm-arch{display:none}',
        '.stage[data-mode="degrade"] .wm-title-inner{left:50%;top:50%;width:min(74vw,560px);transform:translate(-50%,-50%);text-align:center}',
        // `data-reveal="1"` is the still-title switch. It is written by the
        // reduced-motion branch (which never plays a segment) and by the
        // degraded branch, so both curtains read "still, no travel, title up".
        '.stage[data-mode="degrade"][data-reveal="1"] .wm-title-cn span,',
        '.stage[data-mode="degrade"][data-reveal="1"] .wm-title-en,',
        '.stage[data-mode="degrade"][data-reveal="1"] .wm-rule{opacity:1;transform:none;transition:opacity 320ms ease-out}',
        /* --- narrow layout: re-composed, never a shrunk wide frame --- */
        '@media (max-width:720px){',
        '.wm-maid-left{height:calc(var(--wm-stage-h,100vh) * .62);left:6%;transform:translate3d(0,6%,0)}',
        '.stage[data-phase="2"] .wm-maid-left,',
        '.stage[data-phase="3"] .wm-maid-left,',
        '.stage[data-phase="4"] .wm-maid-left,',
        '.stage[data-phase="5"] .wm-maid-left,',
        '.stage[data-phase="6"] .wm-maid-left{transform:translate3d(0,0,0)}',
        '.wm-title-inner{left:6%;right:6%;top:auto;bottom:5%;width:auto;transform:none}',
        '.wm-title-cn{font-size:clamp(22px,7vw,38px);white-space:normal;letter-spacing:.06em}',
        '.wm-tail svg{width:72%;bottom:38%}',
        '.wm-particles g{display:none}}',
    ].join('');
}

/** Build one `<img>` node for artwork. */
function buildImage(doc, className, url, alt) {
    const img = doc.createElement('img');
    img.className = className;
    img.setAttribute('src', url);
    img.setAttribute('alt', alt || '');
    img.setAttribute('draggable', 'false');
    img.setAttribute('decoding', 'async');
    return img;
}

/**
 * Single point where every artwork route is chosen.
 *
 * `options.swap(url)` exists so the file:// preview can substitute self-made
 * inline SVG stand-ins for the very same stage without a second animation
 * implementation. In a normal boot `swap` is undefined and the URL is returned
 * untouched, so the real stage only ever requests `/skin-assets/maid-atelier/`.
 */
function resolveAssetUrl(options, url) {
    const swap = options ? options.swap : null;
    return typeof swap === 'function' ? swap(url) : url;
}

/** Build the whole shadow-root scene, returning the handles we manage. */
function buildScene(doc, shadow, palaceUrl, opts) {
    const wrap = (className) => {
        const div = doc.createElement('div');
        div.className = className;
        return div;
    };

    const style = doc.createElement('style');
    style.textContent = stageCss(palaceUrl);
    shadow.appendChild(style);

    const stage = doc.createElement('div');
    stage.className = 'stage';
    stage.setAttribute('data-mode', opts.mode);
    stage.setAttribute('data-s0', '');
    stage.setAttribute('data-narrow', opts.narrow ? '1' : '0');
    stage.setAttribute('data-right', opts.showRight ? '1' : '0');
    stage.setAttribute('data-chibi', opts.showChibi ? '1' : '0');
    if (stage.style && typeof stage.style.setProperty === 'function') {
        stage.style.setProperty('--wm-stage-h', opts.stageHeightCss);
        if (opts.titleLeft) stage.style.setProperty('--wm-title-left', opts.titleLeft);
        if (opts.titleMax) stage.style.setProperty('--wm-title-max', opts.titleMax);
    }

    // Window/arch shafts give the palace depth without covering anyone.
    const backdrop = wrap('wm-backdrop');
    const arch = wrap('wm-arch');
    for (let i = 0; i < 5; i += 1) arch.appendChild(doc.createElement('span'));
    backdrop.appendChild(arch);
    backdrop.appendChild(wrap('wm-glow'));
    stage.appendChild(backdrop);

    const palace = wrap('wm-palace');
    stage.appendChild(palace);

    // Whale tail silhouette, drawn in SVG so no extra raster is fetched.
    const tail = wrap('wm-tail');
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 420 300');
    svg.setAttribute('aria-hidden', 'true');
    const tailFill = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    tailFill.setAttribute('d', 'M0 150 C90 92 150 96 196 132 C240 96 300 84 420 62 C356 132 356 168 420 238 C300 216 240 204 196 168 C150 204 90 208 0 150 Z');
    const tailLine = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    tailLine.setAttribute('d', 'M0 150 C96 150 150 150 196 150 C244 150 300 150 420 150');
    svg.appendChild(tailFill);
    svg.appendChild(tailLine);
    tail.appendChild(svg);
    stage.appendChild(tail);

    // A handful of lace points, not a screen full of sparkles.
    const particles = wrap('wm-particles');
    for (let i = 0; i < 9; i += 1) particles.appendChild(doc.createElement('g'));
    stage.appendChild(particles);

    const rightUrl = opts.assetUrl(opts.assets['maid-right'].url, 'maid-right');
    const chibiUrl = opts.assetUrl(opts.assets['chibi'].url, 'chibi');
    const leftUrl = opts.assetUrl(opts.assets['maid-left'].url, 'maid-left');
    const maidRight = buildImage(doc, 'wm-maid wm-maid-right', rightUrl, '');
    const chibi = buildImage(doc, 'wm-chibi', chibiUrl, '');
    const maidLeft = buildImage(doc, 'wm-maid wm-maid-left', leftUrl, '');
    if (opts.showRight) stage.appendChild(maidRight);
    if (opts.showChibi) stage.appendChild(chibi);
    stage.appendChild(maidLeft);

    const title = wrap('wm-title');
    const inner = doc.createElement('div');
    inner.className = 'wm-title-inner';
    const cn = doc.createElement('div');
    cn.className = 'wm-title-cn';
    const glyphs = ['深', '海', '女', '仆', '工', '坊'];
    const glyphNodes = [];
    for (let i = 0; i < glyphs.length; i += 1) {
        const span = doc.createElement('span');
        span.textContent = glyphs[i];
        // Layout is reserved up front: only opacity plus a 10px rise animate, so
        // the reveal can never reflow or shift the line.
        if (span.style && typeof span.style.setProperty === 'function') {
            span.style.setProperty('transition-delay', (i * STAGE_CONFIG.charStepMs) + 'ms');
        }
        cn.appendChild(span);
        glyphNodes.push(span);
    }
    inner.appendChild(cn);
    const rule = doc.createElement('div');
    rule.className = 'wm-rule';
    rule.appendChild(doc.createElement('i'));
    rule.appendChild(doc.createElement('u'));
    inner.appendChild(rule);
    const subtitle = doc.createElement('div');
    subtitle.className = 'wm-title-en';
    subtitle.textContent = 'ABYSSAL MAID ATELIER';
    inner.appendChild(subtitle);
    title.appendChild(inner);
    stage.appendChild(title);

    // Curtain panels last so they sit in front during the reveal.
    const curtain = wrap('wm-curtain');
    curtain.appendChild(doc.createElement('i'));
    curtain.appendChild(doc.createElement('i'));
    stage.appendChild(curtain);

    shadow.appendChild(stage);

    return {
        style: style,
        stage: stage,
        backdrop: backdrop,
        palace: palace,
        tail: tail,
        particles: particles,
        maidLeft: maidLeft,
        maidRight: maidRight,
        chibi: chibi,
        title: title,
        titleInner: inner,
        titleCn: cn,
        glyphs: glyphNodes,
        rule: rule,
        subtitle: subtitle,
        curtain: curtain,
    };
}

/**
 * Preload the assets the show actually paints, inside a fixed budget.
 *
 * The rule is "every requested node really decoded": the probe only passes when
 * *all* of them report `naturalWidth > 0`. `complete` is deliberately not used —
 * a broken cached response also reports `complete === true`, which is exactly how
 * a corrupt right maid or chibi used to slip through and play a broken stage.
 * Any single error, or the budget expiring, settles the whole probe as a failure
 * so the show degrades as one unit instead of painting half a scene.
 *
 * The budget runs on the same scheduler as the rest of the show (the injected
 * clock when there is one), so a fake clock can prove the timeout exactly.
 */
function probeAssets(clock, doc, urls, budgetMs, onDone) {
    let settled = false;
    const total = urls.length;
    const nodes = [];
    let timer = null;

    const clearBudget = () => {
        if (timer !== null && clock && typeof clock.clearTimeout === 'function') {
            try { clock.clearTimeout(timer); } catch (_err) { /* ignore */ }
        }
        timer = null;
    };

    const settle = (success) => {
        if (settled) return;
        settled = true;
        clearBudget();
        onDone(success);
    };

    /** True only when every single node has a real, decoded bitmap. */
    const everyNodeDecoded = () => {
        if (!nodes.length) return false;
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (!node || !node.__wmLoaded) return false;
            if (!(Number(node.naturalWidth) > 0)) return false;
        }
        return true;
    };

    for (let i = 0; i < total; i += 1) {
        const img = doc.createElement('img');
        img.setAttribute('decoding', 'async');
        img.setAttribute('alt', '');
        img.__wmLoaded = false;
        const onLoad = () => {
            if (settled) return;
            // A `load` event with no decoded pixels is still a failure.
            if (!(Number(img.naturalWidth) > 0)) { settle(false); return; }
            img.__wmLoaded = true;
            if (everyNodeDecoded()) settle(true);
        };
        const onError = () => {
            if (settled) return;
            settle(false);
        };
        if (typeof img.addEventListener === 'function') {
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);
        } else {
            // Minimal double: keep a handler on the node so a stubbed `src`
            // setter can dispatch synchronously.
            img.onload = onLoad;
            img.onerror = onError;
        }
        img.setAttribute('src', urls[i]);
        nodes.push(img);
        if (settled) break; // an early error already decided the outcome
    }

    if (clock && typeof clock.setTimeout === 'function') {
        timer = clock.setTimeout(() => {
            if (settled) return;
            settle(false);
        }, budgetMs);
    }
    // A node that already carries real dimensions may not fire `load` again.
    for (let i = 0; i < nodes.length && !settled; i += 1) {
        const node = nodes[i];
        if (node && Number(node.naturalWidth) > 0) node.__wmLoaded = true;
    }
    if (!settled && everyNodeDecoded()) settle(true);

    return () => settle(false);
}

/**
 * Create and mount the boot show.
 *
 * Every DOM access lives here, so the module can be imported and driven from
 * Node with a hand-rolled document/window. Pass `opts.clock` to drive the show
 * from a fake clock instead of the real timers.
 *
 * @param {object} [options] - stage options.
 * @param {Document} [options.document] - document to mount into.
 * @param {Window} [options.window] - window providing the timers.
 * @param {object} [options.assets] - asset table (defaults to BOOT_ASSETS).
 * @param {boolean} [options.reducedMotion] - force the reduced-motion branch.
 * @param {Array} [options.timeline] - segment table (defaults to BOOT_SEGMENTS).
 * @param {number} [options.preloadBudgetMs] - asset budget, default 1200.
 * @param {number} [options.maxLifetimeMs] - curtain hard cap, default 8000.
 * @param {object} [options.clock] - {setTimeout, clearTimeout, now?} override.
 * @param {boolean} [options.failBuild] - test hook: throw while building.
 * @returns {object|null} the control object, or null when nothing can mount.
 */
export function createBootShow(options) {
    const opts = options || {};
    const doc = opts.document;
    if (!doc || typeof doc.createElement !== 'function') return null;
    const win = opts.window || doc.defaultView || null;
    const assets = opts.assets || BOOT_ASSETS;
    const timeline = Array.isArray(opts.timeline) && opts.timeline.length ? opts.timeline : BOOT_SEGMENTS;
    const budgetMs = typeof opts.preloadBudgetMs === 'number' ? opts.preloadBudgetMs : PRELOAD_BUDGET_MS;
    const maxLifetimeMs = typeof opts.maxLifetimeMs === 'number' ? opts.maxLifetimeMs : MAX_LIFETIME_MS;
    const clock = opts.clock || (win && typeof win.setTimeout === 'function'
        ? { setTimeout: win.setTimeout.bind(win), clearTimeout: win.clearTimeout.bind(win) }
        : null);

    // Idempotent re-entry: a second call adopts the mounted stage instead of
    // stacking a second curtain.
    const existingHost = typeof doc.querySelector === 'function' ? doc.querySelector(BOOT_HOST_SELECTOR) : null;
    if (existingHost && existingHost.__wmBootControl) return existingHost.__wmBootControl;

    // Single point where every artwork route is chosen. `opts.swap(url, role)`
    // exists so the file:// preview can substitute self-made inline SVG
    // stand-ins without a second animation implementation; a normal boot leaves
    // it undefined and requests only /skin-assets/maid-atelier/. The role is an
    // asset-table key ('maid-left', 'palace-dark', ...) because the URL itself
    // is an opaque hash.
    const swap = typeof opts.swap === 'function' ? opts.swap : null;
    const assetUrl = (url, role) => (swap ? swap(url, role) : url);

    // The five assets this stage may request, and nothing else.
    const urls = [];
    const requested = [];
    const wanted = ['maid-left', 'maid-right', 'palace-light', 'palace-dark', 'chibi'];
    for (let i = 0; i < wanted.length; i += 1) {
        const entry = assets[wanted[i]];
        // `requests` reports the declared route (the contract: only this
        // plugin's same-origin asset route), while the probe loads what the
        // stage will really paint after any preview swap.
        if (entry && entry.url) {
            requested.push(entry.url);
            urls.push(assetUrl(entry.url, wanted[i]));
        }
    }
    const palaceRole = pickPalaceRole(doc);
    const palaceUrl = assetUrl(assets[palaceRole].url, palaceRole);

    const reduced = opts.reducedMotion === true || detectReducedMotion(win, doc);

    let alive = true;
    let done = false;
    let state = 'init';
    let host = null;
    let shadow = null;
    let layers = null;
    let onDocClick = null;
    let onDocKeydown = null;
    let onWinKeydown = null;
    const timers = new Set();
    const rafIds = new Set();
    let ownBodyStyles = null;
    let probeCancel = null;
    const fired = [];

    const control = {
        get state() { return state; },
        get host() { return host; },
        get shadow() { return shadow; },
        get stage() { return layers ? layers.stage : null; },
        get layers() { return layers; },
        get segments() { return timeline; },
        get assets() { return assets; },
        get requests() { return requested.slice(); },
        get loaded() { return urls.slice(); },
        get fired() { return fired.slice(); },
        get skipMs() { return STAGE_CONFIG.skipFadeMs; },
        get alive() { return alive; },
        finish: (reason) => finish(reason || 'skip'),
        dispose: () => teardown('dispose'),
    };

    /** Schedule on the chosen clock and keep the id so teardown can clear it. */
    const later = (fn, ms) => {
        if (!clock || !alive) return null;
        let id = null;
        try {
            id = clock.setTimeout(() => {
                timers.delete(id);
                if (!alive) return;
                try { fn(); } catch (_err) { /* a broken step must not break boot */ }
            }, ms);
        } catch (_err) {
            return null;
        }
        timers.add(id);
        return id;
    };

    /** Run on the next frame(s), falling back to the clock when rAF is absent. */
    const nextFrame = (fn) => {
        if (win && typeof win.requestAnimationFrame === 'function' && typeof win.cancelAnimationFrame === 'function') {
            let id = null;
            const step = (arg) => {
                rafIds.delete(id);
                if (!alive) return;
                try { fn(arg); } catch (_err) { /* ignore */ }
            };
            try {
                id = win.requestAnimationFrame(step);
                rafIds.add(id);
                return;
            } catch (_err) { /* fall through to the clock */ }
        }
        later(() => { try { fn(0); } catch (_err) { /* ignore */ } }, 16);
    };

    /** Remove only the classes, listeners, timers and nodes this plugin owns. */
    const release = () => {
        if (probeCancel) {
            const cancel = probeCancel;
            probeCancel = null;
            try { cancel(); } catch (_err) { /* ignore */ }
        }
        if (onDocClick && doc && typeof doc.removeEventListener === 'function') {
            try { doc.removeEventListener('click', onDocClick, true); } catch (_err) { /* ignore */ }
        }
        if (onDocKeydown && doc && typeof doc.removeEventListener === 'function') {
            try { doc.removeEventListener('keydown', onDocKeydown, true); } catch (_err) { /* ignore */ }
        }
        if (onWinKeydown && win && typeof win.removeEventListener === 'function') {
            try { win.removeEventListener('keydown', onWinKeydown, true); } catch (_err) { /* ignore */ }
        }
        onDocClick = null;
        onDocKeydown = null;
        onWinKeydown = null;

        if (clock && typeof clock.clearTimeout === 'function') {
            timers.forEach((id) => { try { clock.clearTimeout(id); } catch (_err) { /* ignore */ } });
        }
        timers.clear();
        if (win && typeof win.cancelAnimationFrame === 'function') {
            rafIds.forEach((id) => { try { win.cancelAnimationFrame(id); } catch (_err) { /* ignore */ } });
        }
        rafIds.clear();

        // Undo the document-element class (added by the host half, never here).
        try {
            const root = doc.documentElement;
            if (root && root.classList && typeof root.classList.remove === 'function') {
                root.classList.remove(FIRST_PAINT_CLASS);
            } else if (root && typeof root.className === 'string') {
                root.className = root.className
                    .split(/\s+/)
                    .filter((c) => c && c !== FIRST_PAINT_CLASS)
                    .join(' ');
            }
        } catch (_err) { /* ignore */ }

        // Restore the body state we borrowed, field by field, using the captured
        // values. A page that had its own inline overflow must get it back
        // verbatim; a page that had none must get none.
        try {
            if (ownBodyStyles && doc.body && doc.body.style) {
                const bs = doc.body.style;
                if (typeof bs.setProperty === 'function') {
                    for (let i = 0; i < ownBodyStyles.length; i += 1) {
                        const entry = ownBodyStyles[i];
                        if (entry.old) {
                            bs.setProperty(entry.prop, entry.old);
                        } else if (typeof bs.removeProperty === 'function') {
                            bs.removeProperty(entry.prop);
                        }
                    }
                } else {
                    bs.cssText = ownBodyStyles.oldCssText || '';
                }
            }
        } catch (_err) { /* ignore */ }
        ownBodyStyles = null;

        // Only our own host element leaves the body.
        try {
            if (host && host.parentNode && typeof host.parentNode.removeChild === 'function') {
                host.parentNode.removeChild(host);
            }
        } catch (_err) { /* ignore */ }
    };

    /**
     * The single idempotent exit used by the natural end, skip, reduced motion,
     * degradation, errors and the watchdog alike.
     */
    function teardown(reason) {
        if (done) return;
        done = true;
        alive = false;
        state = reason || 'dispose';
        if (state === 'end') state = 'ended';
        release();
        // Hand the curtain back to its owner. The host half owns the first-paint
        // class; if it is absent (the file:// preview) the class removal above
        // already left nothing of ours behind.
        try {
            const boot = win && win.__dshWhaleMaidBoot;
            if (boot && typeof boot.end === 'function') boot.end();
        } catch (_err) { /* ignore */ }
    }

    /** Skip / natural end: stop scheduling, then finish inside budget. */
    function finish(reason) {
        if (done || state === 'skipping') return;
        state = 'skipping';
        // Nothing may fire after a skip.
        if (clock && typeof clock.clearTimeout === 'function') {
            timers.forEach((id) => { try { clock.clearTimeout(id); } catch (_err) { /* ignore */ } });
        }
        timers.clear();
        if (win && typeof win.cancelAnimationFrame === 'function') {
            rafIds.forEach((id) => { try { win.cancelAnimationFrame(id); } catch (_err) { /* ignore */ } });
        }
        rafIds.clear();
        const ending = reason === 'end';
        // The natural end fades the whole stage out over the full 800 ms before
        // the node is removed; a skip is a user action and must be gone in 150 ms.
        const fadeMs = ending ? FADE_OUT_MS : Math.min(STAGE_CONFIG.skipFadeMs, 150);
        fadeHost(fadeMs);
        const label = ending ? 'ended' : 'skipped';
        if (!clock) {
            teardown(label);
            return;
        }
        later(() => teardown(label), fadeMs);
    }

    /**
     * Begin the fade-out and pin the style that drives it.
     *
     * Two mechanisms on purpose: `data-state="fade-out"` for any stylesheet that
     * keys off it, and an explicit `:host` opacity of 0 for the transition to
     * end at. Writing the second one by hand makes the fade-out independent of
     * the attribute rules, so a stale "visible" write can never resurrect a
     * stage that is already on its way out.
     */
    const fadeHost = (fadeMs) => {
        try {
            if (!host) return;
            host.setAttribute('data-state', 'fade-out');
            if (host.style && typeof host.style.setProperty === 'function') {
                host.style.setProperty('transition-duration', fadeMs + 'ms');
                host.style.setProperty('opacity', '0');
            }
        } catch (_err) { /* ignore */ }
    };

    /** Monotonic reveal: `data-phase` only ever advances, never decreases. */
    let phase = 0;
    const advancePhase = (next) => {
        if (!layers || !layers.stage) return;
        if (next <= phase) return;
        phase = next;
        try { layers.stage.setAttribute('data-phase', String(phase)); } catch (_err) { /* ignore */ }
    };

    /**
     * Bring the stage on screen. Gated on alive/done ONLY — never on `state`.
     * The kick-off tick is not the only caller, and a state check here once lost
     * the race against the (microtask-fast) preload callback: with a warm asset
     * cache `state` was already 'playing' by the second frame, so `visible` was
     * never written and the whole show played at `:host{opacity:0}` while still
     * covering (and eating clicks on) the page.
     */
    const revealHost = () => {
        if (!host || done || !alive) return;
        try {
            if (typeof host.setAttribute === 'function') host.setAttribute('data-state', 'visible');
        } catch (_err) { /* ignore */ }
    };

    /**
     * Apply one segment.
     *
     * Two channels per segment, with different lifetimes:
     *  - `data-phase="N"` is MONOTONIC: it records how far the show has got and
     *    is only ever advanced. Every "this has been revealed" rule keys off it,
     *    so an element that has entered can never fall back to its hidden base.
     *  - `data-sN` is a ONE-SHOT animation trigger, cleared by the next segment,
     *    used only for effects that are allowed to finish and fade away again
     *    (the landing breath, the single gold sweep, the one tail pass).
     */
    const applySegment = (segment, atMs) => {
        if (!alive || done) return;
        if (state === 'init' || state === 'preload') state = 'playing';
        if (segment.id === 'finished') {
            fired.push({ index: segment.index, id: segment.id, at: segment.at, firedAt: atMs });
            // Segment 6 is the fade-out itself: run the same idempotent exit the
            // skip uses, and only unmount once the 800 ms fade has finished.
            finish('end');
            return;
        }
        if (layers && layers.stage) {
            const stage = layers.stage;
            if (segment.index > 0) stage.removeAttribute('data-s' + (segment.index - 1));
            stage.setAttribute('data-s' + segment.index, '');
            advancePhase(segment.index);
            // The curtain's exit is a terminal state, written once and never
            // cleared, so parting the panels cannot be undone later.
            if (segment.id === 'curtain-open') {
                try { stage.setAttribute('data-curtain', 'open'); } catch (_err) { /* ignore */ }
            }
        }
        fired.push({ index: segment.index, id: segment.id, at: segment.at, firedAt: atMs });
        if (typeof opts.onSegment === 'function') {
            // Observation hook for offline assertions: it runs inside its own
            // guard so a throwing observer can never break the show.
            try { opts.onSegment(segment, { firedAt: atMs, index: fired.length - 1 }); } catch (_err) { /* ignore */ }
        }
    };

    /** Drive the declared table from the stage clock, segment by segment. */
    const startTimeline = () => {
        state = 'playing';
        // The host must be on screen for the whole run. Gated only on
        // alive/done: a state check here once lost the race against the
        // (microtask-fast) preload callback and left the stage at opacity 0.
        revealHost();
        advancePhase(0);
        for (let i = 0; i < timeline.length; i += 1) {
            const segment = timeline[i];
            const at = typeof segment.at === 'number' ? segment.at : i * 100;
            later(() => applySegment(segment, at), at);
        }
    };

    /** Last-resort curtain: short, still, text/SVG only. */
    const startDegrade = () => {
        state = 'degrade';
        try {
            if (layers && layers.stage) {
                layers.stage.setAttribute('data-mode', 'degrade');
                // Static title, no travel: the same switch the reduced-motion
                // branch uses, so both curtains look and behave alike.
                layers.stage.setAttribute('data-reveal', '1');
            }
            revealHost();
        } catch (_err) { /* ignore */ }
        later(() => fadeHost(DEGRADE_TOTAL_MS - 220), DEGRADE_TOTAL_MS - 220);
        later(() => teardown('degraded'), DEGRADE_TOTAL_MS);
    };

    // Watchdogs first: the show may never outlive its hard cap, and a 550c that
    // appears after us still wins. The cap fires exactly at `maxLifetimeMs`
    // (default 8000 ms, counted from the first painted frame) — there is no
    // extra grace on top of the number the contract declares.
    later(() => { if (!done) teardown('timeout'); }, maxLifetimeMs);
    later(function pollRival() {
        if (!alive || done) return;
        if (rivalActive(win, doc)) { teardown('yield-550c'); return; }
        later(pollRival, RIVAL_POLL_MS);
    }, RIVAL_POLL_MS);

    // Kick off on the next tick so the first paint is already on screen: click
    // and Escape are therefore live from the very first frame.
    later(() => {
        if (!alive || done) return;
        // The curtain must be painted for the whole run, on every branch. This
        // is deliberately unconditional (alive/done only) and placed before the
        // branch, so no later code path can leave the stage stuck at opacity 0.
        revealHost();
        if (reduced) {
            // Reduced motion: no travel at all, and the curtain goes away fast.
            // It still shows a title: the same static `data-reveal` switch the
            // degraded curtain uses, so the reduced-motion experience is a still
            // titled card rather than 320 ms of empty navy.
            state = 'reduced';
            try {
                if (layers && layers.stage) {
                    layers.stage.setAttribute('data-mode', 'degrade');
                    layers.stage.setAttribute('data-reveal', '1');
                }
            } catch (_err) { /* ignore */ }
            revealHost();
            later(() => fadeHost(REDUCED_FALLBACK_MS - 120), REDUCED_FALLBACK_MS - 120);
            later(() => teardown('reduced-motion'), REDUCED_FALLBACK_MS);
            return;
        }
        state = 'preload';
        probeCancel = probeAssets(clock, doc, urls, budgetMs, (usable) => {
            probeCancel = null;
            if (!alive || done) return;
            if (usable) startTimeline();
            else startDegrade();
        });
    }, 0);

    try {
        // --- mount: the only part that touches the main document ---------------
        if (opts.failBuild) throw new Error('dsh-whale-maid: forced build failure');
        if (rivalActive(win, doc)) {
            // 550c got there first: do not mount, yield immediately.
            done = true;
            alive = false;
            state = 'yield-550c';
            release();
            return control;
        }

        host = doc.createElement('div');
        host.className = 'dsh-whale-maid-boot-host';
        host.setAttribute('data-state', 'hidden');
        host.setAttribute('aria-hidden', 'true');
        host.setAttribute('data-whale-maid-boot', '1');
        shadow = typeof host.attachShadow === 'function' ? host.attachShadow({ mode: 'open' }) : null;
        if (!shadow) {
            // Without shadow DOM nothing can be isolated, so do not mount at all.
            done = true;
            alive = false;
            state = 'unsupported';
            release();
            return control;
        }

        let stageHeightCss = '100vh';
        let narrow = false;
        let stageW = 0;
        let stageH = 0;
        try {
            const de = doc.documentElement || {};
            const w = win && win.innerWidth ? win.innerWidth : (de.clientWidth || 0);
            const h = win && win.innerHeight ? win.innerHeight : (de.clientHeight || 0);
            stageW = w || 0;
            stageH = h || 0;
            if (h > 0) stageHeightCss = h + 'px';
            narrow = stageW > 0 && stageW <= STAGE_CONFIG.narrowPx;
        } catch (_err) { /* keep the CSS defaults */ }

        // Side by side the maids need 1.0173*H + 32px. The title also owns a
        // reserved box to the right of the main sprite, and that box must not
        // run under the right maid. When both cannot fit, the RIGHT MAID yields
        // (the documented priority: main sprite > title > palace > right Q > fx),
        // and the title is given the wider, relaxed box instead.
        const spriteRight = STAGE_CONFIG.twoMaidWidthFactor * stageH;
        const titleNeeds = Math.min(stageW * 0.4, TITLE_MAX_PX);
        const narrowTitleLeft = stageW * 0.52;
        const roomForTwo = stageH > 0 && stageW >= (spriteRight + STAGE_CONFIG.twoMaidGapPx);
        const roomForTitle = stageW >= (spriteRight + STAGE_CONFIG.twoMaidGapPx + titleNeeds);
        const showRight = !narrow && roomForTwo && roomForTitle && stageH >= STAGE_CONFIG.rightMaidMinPx;
        const showChibi = !narrow && stageH >= STAGE_CONFIG.chibiMinPx && (!showRight || stageW >= 0.78 * stageH);
        // Geometry-only fallback: when the right maid had to stand down, or there
        // simply is not room for a wide box, the title collapses to its compact
        // form tucked against the main sprite instead of reaching across.
        const narrowTitle = narrow || !showRight || !roomForTitle;
        const titleLeft = narrowTitle ? narrowTitleLeft : (spriteRight + STAGE_CONFIG.twoMaidGapPx);
        const titleMax = narrowTitle
            ? Math.max(240, Math.min(0.9 * TITLE_MAX_PX, stageW - titleLeft - 32))
            : Math.min(TITLE_MAX_PX, stageW - titleLeft - 32);

        layers = buildScene(doc, shadow, palaceUrl, {
            mode: 'normal',
            narrow: narrow,
            showRight: showRight,
            showChibi: showChibi,
            stageHeightCss: stageHeightCss,
            titleLeft: titleLeft + 'px',
            titleMax: Math.max(160, titleMax) + 'px',
            assets: assets,
            assetUrl: assetUrl,
        });

        // Body scroll lock, remembered exactly so it can be put back.
        if (doc.body && doc.body.style) {
            try {
                const bs = doc.body.style;
                if (typeof bs.setProperty === 'function') {
                    ownBodyStyles = [{
                        prop: 'overflow',
                        old: typeof bs.getPropertyValue === 'function' ? bs.getPropertyValue('overflow') : '',
                    }];
                    bs.setProperty('overflow', 'hidden');
                } else {
                    ownBodyStyles = [{ prop: 'overflow', oldCssText: doc.body.style.cssText || '' }];
                    doc.body.style.cssText = scalarCss('overflow: hidden');
                }
            } catch (_err) { ownBodyStyles = null; }
        }

        if (doc.body && typeof doc.body.appendChild === 'function') doc.body.appendChild(host);
        host.__wmBootControl = control;

        // Click and Escape are live from the first painted frame.
        onDocClick = () => finish('click');
        onDocKeydown = (event) => {
            const key = event && (event.key || event.keyCode);
            if (key === 'Escape' || key === 'Esc' || key === 27) finish('escape');
        };
        onWinKeydown = onDocKeydown;
        if (typeof doc.addEventListener === 'function') {
            doc.addEventListener('click', onDocClick, true);
            doc.addEventListener('keydown', onDocKeydown, true);
        }
        if (win && typeof win.addEventListener === 'function') win.addEventListener('keydown', onWinKeydown, true);

        // Fade the curtain in over two frames. Note this is NOT the only place
        // that writes `visible`: the kick-off tick does it unconditionally as
        // well, because a warm asset cache can finish the preload before these
        // frames run — and a `state`-gated writer used to lose exactly that race
        // and leave the whole show at `:host{opacity:0}`.
        nextFrame(() => {
            nextFrame(revealHost);
        });
    } catch (_err) {
        // The animation body threw mid-build: the curtain still comes down and
        // the exception never escapes into the host's boot path.
        try { teardown('error'); } catch (_inner) { /* ignore */ }
        return control;
    }

    return control;
}

/**
 * Mount the client half.
 *
 * @param {object} ctx - the client plugin's cordis context.
 * @returns {object} a handle exposing `dispose()`.
 */
export function apply(ctx) {
    if (!ctx || typeof ctx.effect !== 'function') return { dispose() {} };
    let handle = null;
    const disposer = ctx.effect(() => {
        let created = null;
        try {
            created = createBootShow({
                document: typeof document !== 'undefined' ? document : null,
                window: typeof window !== 'undefined' ? window : null,
            });
        } catch (_err) {
            // Installing must never be able to break the boot path.
            created = null;
        }
        handle = created;
        return () => {
            try {
                if (handle && typeof handle.dispose === 'function') handle.dispose();
            } catch (_err) { /* ignore */ }
            handle = null;
        };
    }, 'dsh-whale-maid: boot stage');
    return {
        get boot() { return handle; },
        dispose() {
            try { if (disposer) disposer(); } catch (_err) { /* ignore */ }
        },
    };
}
