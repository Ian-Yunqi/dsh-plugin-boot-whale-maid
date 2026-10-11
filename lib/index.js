import { installArtwork } from './artwork.js';
/**
 * dsh-boot — the host-plane half.
 *
 * The stage itself is browser-side (lib/client.js). Its FIRST FRAME cannot be:
 * DSH draws its own boot card ("HARNESS / Loading plugins…") from the shell
 * bundle before any client plugin is materialised, so a plugin that only paints
 * from its own bundle always leaves that card on screen for a few hundred
 * milliseconds, at any z-index. The only surface that exists earlier than the
 * shell is the served document, and DSH exposes it as `webserver/index-inject`:
 * the carrier collects a table of index rows and renders them into the served
 * index.html — a `style` row becomes a `<style>` appended to `<head>`, and a
 * `script` row with `placement: 'head'` becomes a `<script>` appended to
 * `<head>` (verified against the carrier's own index-injection switch), so both
 * land while the document is still parsing and the card is never visible in the
 * first place.
 *
 * THE INJECTED SCRIPT:
 *
 *   * runs SYNCHRONOUSLY, in `<head>`, during document parsing — it therefore
 *     adds exactly one class to documentElement, waits for no resource and does
 *     no complex initialisation;
 *   * has ALL of its logic inside a single top-level try/catch. An exception
 *     anywhere in it must not be able to break the page: the worst acceptable
 *     outcome is that no curtain is painted at all;
 *   * imports NOTHING — no third-party runtime dependency, no Node built-in, no
 *     DOM node of its own beyond the state class. This file's only imports would
 *     be `node:`-prefixed if it ever needed one.
 *
 * CONTRACTS THE SCRIPT KEEPS (all host-side; no client bundle required):
 *
 *   end()            idempotent teardown, exposed as
 *                    `window.__dshWhaleMaidBoot.end`. lib/client.js calls this
 *                    SAME entry point from its own single teardown once its
 *                    stage is on screen, and also removes this plugin's state
 *                    class itself — the host script's own fallbacks exist so a
 *                    client bundle that never loads still yields.
 *   8000 ms ceiling  unconditional: from the moment the curtain appears it can
 *                    never outlive FIRST_FRAME_MAX_MS, whatever the client does.
 *                    (lib/client.js independently caps its own stage at the same
 *                    8000 ms; the two ceilings agree by construction.)
 *   click / Escape   live from the moment the curtain appears, in the CAPTURE
 *                    phase, so a click or Escape retires it immediately even
 *                    while the client half is still loading.
 *   550c mutex       BOTH directions. If `dsh550c-first` is already on
 *                    documentElement, or `window.__dsh550cBoot` already exists,
 *                    the script returns before touching the DOM at all. If 550c
 *                    appears AFTER us, the watch yields to it within one tick.
 *                    Only plugin-owned state is ever cleaned; 550c's private
 *                    behaviour is never called, read or modified.
 *   failure state    DSH renders a failed boot by REMOVING the spinner from
 *                    `[data-dsh-boot]` (the frontend's boot card calls
 *                    `this.spinner.remove()` on failure) — so a missing
 *                    `[data-dsh-boot-spinner]` while the card is up means the
 *                    page must be readable, and the curtain retires.
 *
 * WHAT THIS FILE DOES NOT DO: it creates no element in the main document and
 * sets no global style beyond the `::before` curtain bound to its own state
 * class, so the client half stays the single owner of the stage DOM and teardown
 * can never have two owners fighting over one node.
 *
 * @module dsh-boot
 */

/**
 * Plugin row identity. Matches `id:` in cordis.patch.yml and the package name.
 */
export const name = 'boot-whale-maid'

/**
 * No service is injected. `webserver/index-inject` is a plain composition event
 * the carrier emits once per served index document, so requiring a service would
 * only stop the curtain from being offered in carriers that lack one. This row
 * registers exactly one listener and owns no other registration.
 */
export const inject = []

/** First-frame state class on documentElement; the whole curtain hangs off it. */
const FIRST_FRAME_CLASS = 'dsh-whale-maid-first'
/** Teardown hook the client half calls once its stage is on screen. */
const FIRST_FRAME_GLOBAL = '__dshWhaleMaidBoot'
/** The other boot plugin's state class; its presence means 550c owns the boot. */
const RIVAL_CLASS = 'dsh550c-first'
/** The other boot plugin's handshake global, checked on entry and while watching. */
const RIVAL_GLOBAL = '__dsh550cBoot'

/**
 * Deep-sea palette of the curtain's radial gradient, top-lit like a stage wash.
 * Painted by the `::before` pseudo-element only, so the documentElement keeps
 * whatever background the application and the active theme set — this plugin
 * never permanently overrides another surface's styling.
 */
const SEA_HIGH = '#0e3a5c'
const SEA_MID = '#0a2b45'
const SEA_DEEP = '#04121f'

/**
 * Absolute ceiling (ms) on the curtain's life, counted from the moment it
 * appears. Independent of the client half: a client bundle that fails to load
 * must never leave a cover behind.
 */
const FIRST_FRAME_MAX_MS = 14000

/**
 * One polling cadence for every host-side watch: the native boot-card watch and
 * the late-550c yield. 120 ms is under the 150 ms skip budget with margin and
 * still only ~8 ticks/s during boot. The skip gestures themselves are event
 * driven and do not wait for a tick.
 */
const WATCH_MS = 120

/**
 * One step BELOW the client half's shadow host (`:host{...;
 * z-index:2147483000}` in lib/client.js) and still above every layer DSH paints
 * for the boot card, so the handoff is strictly ordered: the curtain is up from
 * the first paint, and the moment the stage host is appended it is above the
 * curtain — same glass, one paint, no seam. The reference implementation parks
 * its own cover one step below its splash for the same reason.
 */
const FIRST_FRAME_Z = 2147482000

/**
 * The curtain.
 *
 * `position:fixed; inset:0` on the plugin's own state class, painted by a
 * `::before` pseudo-element: no element is added to the document, nothing in the
 * flow is displaced, and no existing rule is overridden — the class is the
 * curtain, and removing the class removes it completely. `content:""` is what
 * makes the pseudo-element generate a box at all. `pointer-events:none` keeps
 * the covered card and page interactive, so a click still reaches the page's own
 * handlers in the same beat this plugin's capture listener sees it.
 */
const FIRST_FRAME_CSS =
  'html.' +
  FIRST_FRAME_CLASS +
  '::before{content:"";position:fixed;inset:0;' +
  'background:radial-gradient(120% 90% at 50% 12%,' +
  SEA_HIGH +
  ' 0%,' +
  SEA_MID +
  ' 42%,' +
  SEA_DEEP +
  ' 100%);' +
  'z-index:' +
  String(FIRST_FRAME_Z) +
  ';pointer-events:none}\n' +
  'html.' +
  FIRST_FRAME_CLASS +
  '{background:' +
  SEA_DEEP +
  '}'

/**
 * The curtain script: marker, handshake, skips, watches, ceiling.
 *
 * Deliberately tiny, fully synchronous and free of any awaited resource — it
 * runs while <head> is being parsed, so the class must be on documentElement
 * before the first paint. Every fallback is armed as a side effect of the
 * curtain appearing, so the whole lifetime is owned here: the client half can
 * only ever make it end earlier, never later, and `end()` is idempotent so the
 * two owners can call it in any order without a double teardown.
 */
const FIRST_FRAME_SCRIPT =
  '(function(){try{' +
  'var root=document.documentElement;' +
  'var win=window;' +
  'if(root===null||root===undefined||!root.classList){return}' +
  // Entry mutex: 550c arrived first, so it owns the boot and we touch nothing.
  // The rival global is tested for truth — `!== undefined && !== null` would be a
  // trap: when 550c is absent the operand is `undefined`, so a `||` chain over
  // both comparisons is TRUE and the curtain would retire on its own first tick.
  'if(root.classList.contains(' +
  JSON.stringify(RIVAL_CLASS) +
  ')){return}' +
  'if(win.' +
  RIVAL_GLOBAL +
  '){return}' +
  // Guard the global too: a second injection (HMR, a re-served document) must
  // not stack listeners and timers on a curtain that is already up.
  'if(win.' +
  FIRST_FRAME_GLOBAL +
  '&&typeof win.' +
  FIRST_FRAME_GLOBAL +
  '.end==="function"){return}' +
  'var done=false;' +
  'var watch=null;' +
  'var failsafe=null;' +
  'var seen=false;' +
  'var onKey=null;' +
  'var onClick=null;' +
  'function unhook(){' +
  'if(onClick!==null){document.removeEventListener("click",onClick,true);onClick=null}' +
  'if(onKey!==null){document.removeEventListener("keydown",onKey,true);onKey=null}' +
  '}' +
  // end(): the only teardown. Idempotent, and it never touches 550c's state.
  'function end(reason){' +
  'if(done){return}' +
  'done=true;' +
  'if(watch!==null){win.clearInterval(watch);watch=null}' +
  'if(failsafe!==null){win.clearTimeout(failsafe);failsafe=null}' +
  'unhook();' +
  'root.classList.remove(' +
  JSON.stringify(FIRST_FRAME_CLASS) +
  ')' +
  '}' +
  'function state(){return{ended:done,className:' +
  JSON.stringify(FIRST_FRAME_CLASS) +
  ',maxMs:' +
  String(FIRST_FRAME_MAX_MS) +
  ',zIndex:' +
  String(FIRST_FRAME_Z) +
  '}}' +
  // The handshake lib/client.js calls from its own single teardown.
  'win.' +
  FIRST_FRAME_GLOBAL +
  '={end:end,state:state};' +
  'root.classList.add(' +
  JSON.stringify(FIRST_FRAME_CLASS) +
  ');' +
  // Skip: live from the first frame, in the capture phase, so it wins over any
  // handler the covered page may have wired for the same gesture.
  'onClick=function(){end("click")};' +
  'document.addEventListener("click",onClick,true);' +
  'onKey=function(event){if(event&&(event.key==="Escape"||event.keyCode===27)){end("escape")}};' +
  'document.addEventListener("keydown",onKey,true);' +
  // Both native signals, once the card has actually been seen. On a cold boot
  // the injection lands while <head> is still parsing, i.e. before the shell
  // builds the card, so an unconditional "card absent" branch would retire the
  // curtain in the same beat it appeared — hence `seen`: only a card that was up
  // and then went away means the application mounted. The same tick also yields
  // to a 550c that arrived after us; the client half is the usual and earlier
  // way out, this is the fallback that needs nothing from it.
  'watch=win.setInterval(function(){' +
  'if(done){return}' +
  'if(root.classList.contains(' +
  JSON.stringify(RIVAL_CLASS) +
  ')||win.' +
  RIVAL_GLOBAL +
  '){end("550c-arrived");return}' +
  'var card=document.querySelector("[data-dsh-boot]");' +
  'if(card===null){if(seen){end("app-mounted")}return}' +
  'seen=true;' +
  'if(card.querySelector("[data-dsh-boot-spinner]")===null){end("boot-failed")}' +
  '},' +
  String(WATCH_MS) +
  ');' +
  // Backstop that depends on nothing else: from here on, the curtain is gone
  // within FIRST_FRAME_MAX_MS no matter what the client half does.
  'failsafe=win.setTimeout(function(){end("timeout")},' +
  String(FIRST_FRAME_MAX_MS) +
  ')' +
  // The whole script, wrapping every line above. Nothing may escape: the worst
  // outcome is always "no animation", never a broken boot.
  '}catch(error){try{var r=document.documentElement;if(r&&r.classList){r.classList.remove(' +
  JSON.stringify(FIRST_FRAME_CLASS) +
  ')}}catch(inner){}}})()'

/**
 * Contribute the first frame to every index response.
 *
 * Exactly one listener is registered: `webserver/index-inject` is a composition
 * event the carrier emits per served document, and rows are only rendered when a
 * page is actually served, so this costs two rows and nothing at all when nobody
 * asks for one. Order matters — the `style` row precedes the `script` row so the
 * class has a rule to bind to on the very first paint; the `global` row is last
 * so it is readable by the time the client half evaluates, and it is the
 * page-side handle for the values the client would otherwise have to hardcode.
 *
 * @param ctx - the plugin context.
 */
export function apply(ctx) {
  if (typeof ctx.inject === 'function') installArtwork(ctx);
  ctx.on('webserver/index-inject', (table) => {
    table.push({ kind: 'style', text: FIRST_FRAME_CSS })
    table.push({ kind: 'script', placement: 'head', text: FIRST_FRAME_SCRIPT })
    table.push({
      kind: 'global',
      name: 'whaleMaidBoot',
      value: { zIndex: FIRST_FRAME_Z, maxMs: FIRST_FRAME_MAX_MS, className: FIRST_FRAME_CLASS },
    })
  })
}
