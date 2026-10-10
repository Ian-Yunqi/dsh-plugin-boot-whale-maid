# dsh-plugin-boot-whale-maid — 独立验证报告（任务 t12）

- **验证者**：离线验证与评审（AgentTeams 成员）· **本次复跑（attempt 3）**：2026-10-10 22:32–22:33（本机时区），干净 `node` v24.21.0 进程
- **方法**：① 逐条复跑用户列出的四条自动验收命令（原文、退出码、输出摘录）；② 另写一份最小假 DOM + 可控假时钟探针（**不改动任何交付文件**）独立复现关键失败路径、清理与阈值；③ 只读核对 preview、素材 hash、署名链、主文档污染与 profile 对照证据
- **写入边界**：本任务**只写本文件**。`lib/`、`scripts/`、`README.md`、`docs/assets.json`、`package.json`、`cordis.patch.yml`、`dsh-plugin-hello/` 均未改动；探针源码在会话临时目录（`%TEMP%\wm-t12\`），不进入包内
- **结论**：**验证未通过（status=failed）** —— 四条命令 3 条通过，`node scripts/assert.mjs` **exit 1**（套件本身处于红态，且在验证窗口内被改写两次）

> ⚠️ **版本冻结声明**：验证期间本包**仍在并发修复**。本次窗口内 `lib/client.js` 至少出现 3 个哈希、`scripts/assert.mjs` 在 65 秒内出现 2 个哈希（`B58344F1…` → `F6F43D40…`，红态由 2 条失败变为 15 条）。**本报告结论只绑定 §0.1 表中所列修订**；最终必须由 t14 在冻结点原样重跑 §1 与 §2。

---

## 0. 摘要

### 0.1 受审修订（本次 capture 时点的 SHA256 与最后写入时间）

| 文件 | SHA256(16) | mtime | 说明 |
|---|---|---|---|
| `lib/client.js` | `440E7357692297C8` | 22:32:15 | 探针快照与此一致（完整 SHA256 `440E7357692297C8B0CE542C9ACCCD889D4915F4DBE02568E9D657B3B400C315`） |
| `lib/index.js` | `BA8B0EE9E73023E2` | 22:06:24 | 完整 SHA256 `BA8B0EE9E73023E2186ECF4ABCB45596AD0560FDFFB84BED44492D407D5CD1A6` |
| `scripts/assert.mjs` | `B58344F1E22C10416` → `F6F43D40F922B275` | 22:31:54 → 22:32:59 | **窗口内被改写**，两次结果都记在 §1.4 |
| `scripts/smoke.mjs` | `0C7B200F193F889E` | 22:24:59 | 60 → 74 项 |
| `scripts/preview.html` | `83C4F706B90FDE0F` | 22:13:39 | 本次未变 |
| `docs/assets.json` | `F553EA7A77E5BEB1` | 22:18:55 | 本次未变 |
| `docs/ATTRIBUTION.md` | `46A1F6D084527639` | 21:58:05 | 本次未变 |
| `docs/ART-NOTES.md` | `8E7C3308485CBED5` | 21:57:48 | 本次未变 |
| `docs/RELEASE.md` | `959B846CB34FD368` | 22:30:06 | 非本任务文件（其他成员新增） |
| `README.md` | `C67FCE3B41DA4567` | 22:25:43 | 本次未变 |
| `LICENSE` | `0F89A5C6D69592DB` | 22:25:48 | 本次未变 |
| `package.json` | `6E66904C7F81173E` | 22:25:48 | 本次未变 |
| `cordis.patch.yml` | `158BAC806483F8DD` | 22:01:22 | 本次未变 |

### 0.2 逐项验收对照（本次 capture）

| # | 验收项 | 结论 | 证据 |
|---|---|---|---|
| 1 | `node --check lib/index.js` / `lib/client.js` 均 exit 0 并附实际输出 | ✅ | §1.1、§1.2（两者输出均为空） |
| 2 | `smoke.mjs` exit 0，覆盖清单字段与 apply() 注册 | ✅ | §1.3（`74/74 checks passed`） |
| 3 | `assert.mjs` exit 0，覆盖 stage 创建/时间线逐段/跳过/dispose 无残留/抛错撤首帧 | ❌ **exit 1** | §1.4（两次 capture：2 条失败 → 15 条失败） |
| 4 | `preview.html` 存在、自包含、入口路径真实 | ✅ | §3.1 |
| 5 | `docs/assets.json` 每个 hash 在 maid-atelier `lib/client.js` 字面可查；README 含三作者与 CC BY-NC-SA 4.0 | ✅ | §3.2、§3.3 |
| 6 | `~/.dsh/profiles/desktop` 未被改动的对照证据 | ✅（1 处需注意） | §3.5 |
| 7 | 自写探针覆盖 11 类失败路径 + 清理零残留 + 1200ms/8000ms 阈值 | ✅ **149 项全通过** | §2 |

**唯一阻塞项**：验收项 3（`assert.mjs` 未达 exit 0）。其余全部达标。

---

## 1. 契约四条命令（原文 · 退出码 · 关键输出）

### 1.1 `node --check dsh-plugin-boot-whale-maid/lib/index.js`

- 退出码：**0**；实际输出：**空**（`--check` 通过时不打印内容，这就是它的正常输出）

### 1.2 `node --check dsh-plugin-boot-whale-maid/lib/client.js`

- 退出码：**0**；实际输出：**空**

### 1.3 `node dsh-plugin-boot-whale-maid/scripts/smoke.mjs`

- 退出码：**0**；末行：`74/74 checks passed`
- **清单字段**（摘录）：`main entry exists (./lib/index.js)`、`exports["."] matches main`、`exports["./client"] points at a real file`、`dsh.client.platform is "web"`、`every peerDependency is declared in peerDependenciesMeta`、`every peerDependency is optional`、`no client-library peerDependency is declared that the sources never import`、`every files[] entry exists on disk [6 entries]`
- **apply() 注册**（摘录）：`host entry exports apply()`、`host apply() does not throw on a cordis-shaped context`、`apply() subscribes exactly once, to webserver/index-inject`、`index-inject callback runs without throwing`、`index-inject contributes a style row (1)`、`index-inject contributes a script row (1)`、`injected script references [data-dsh-boot-spinner] — detects the native failure state`、`client apply() does not throw with an effect service`、`client apply() registers exactly one effect (1) [["dsh-whale-maid: boot stage"]]`

### 1.4 `node dsh-plugin-boot-whale-maid/scripts/assert.mjs` — ❌ 未通过（exit 1）

套件在验证窗口内被改写两次，两次都失败：

**capture A（`B58344F1E22C10416`，22:31:54）**：`checks: 402, failures: 2`、`RESULT: FAIL`、exit 1

```
FAIL  the host is opaque for phases 0..5 :: expected 1, got 0
FAIL  the reserved title box starts right of the left sprite :: title starts at 704.1497599999999
```

**capture B（`F6F43D40F922B275`，22:32:59）**：`checks: 407, failures: 15`、`RESULT: FAIL`、exit 1。失败集中在「元素找不到（`got null`）」这一族：

```
FAIL  the title glyphs are still hidden before their segment :: expected 0, got null
FAIL  the title glyphs reveal on segment 4 :: expected 1, got null
FAIL  the title glyphs stay revealed after the sweep flag is cleared :: expected 1, got null
FAIL  the curtain panels are off-screen at phase 2/3/4/5/6 / at every phase from 2 to 6 :: null
FAIL  the still-title switch reveals the title in the degraded curtain :: expected 1, got null
FAIL  the still-title switch removes the travel (no transform) :: expected none, got null
FAIL  the reduced/degraded title is fully opaque :: expected 1, got null
…（共 15 条）
```

**覆盖广度（源码层，回应「五项覆盖」）**：当前套件有 18 个 section（§3 stage 结构、§4 时间线逐段、§5/§6 点击与 Esc、§10 抛错撤首帧、§11/§12 dispose 与零残留、§13 550c、§14 窄屏、§15 preview 适配器、§16–§18 修复轮新增的规则级断言）。**五项覆盖都存在**（我的独立探针也在五项上全 PASS），但 `exit 0` 未达成；且 capture B 的 `got null` 族说明套件当前引用了实现里尚不存在的节点/属性（或套件本身仍在半途），必须由修复方收口后复跑。

---

## 2. 自写独立探针（不改动交付文件）

### 2.1 复现方法

探针源码见附录 A（**618 行 / 31,902 字节，SHA256 `72FAAA39AEC6DBED9D6D208F4EAE70AA51456B3D97628C36D7E0E86B326BCA54`**）。复现：

```powershell
# 把 client.js / index.js 冻结成快照（本次 = 440E7357… / BA8B0EE9…）
# snap/package.json 内容为 {"type":"module"}，使 Node 按 ESM 解析 .js
node t12-probe.mjs <snap>/client.js <snap>/index.js
```

探针自带 `FakeStyle / El / FakeDocument / FakeWindow / FakeClock`（假窗口**刻意不提供** `setTimeout`/`requestAnimationFrame`，时间只由假时钟推进，无真实等待）与断言器，失败即 `exit 1`。

### 2.2 结果：**149 项 / 149 通过 / 0 失败 / `RESULT: PASS`（exit 0）**

- 快照：`client.js 440E7357692297C8…C315`（与当时 live 一致）+ `index.js BA8B0EE9E73023E2…D1A6`
- 覆盖 15 个 section：A 未启动/无效参数 · B 重复初始化 · C 首帧 click/Esc · D 播放期 click/Esc · E 素材失败 · F 预载预算 · G 构建抛错 · H 中途 dispose · I 迟到回调 · J 550c 双向互斥 · K 硬上限实测 · L 主文档污染与残留 · M 段表取值 · N 宿主半边注入与幕布 · O 自然结束
- 实测阈值（INFO）：`stage torn down 8000 ms after mount (state=timeout)`；宿主半边 `host failsafe ceiling is exactly 8000 ms` → **两侧上限都是精确 8000ms**（早期评审提到的 8040ms 已不复现）
- 自然结束：`fired[]` 记录 8/8 段，声明偏移 0/500/1800/2050/3200/4400/5600/6400 全部吻合；观测钩子在 7 个特效段上的实际触发时刻严格等于 `show zero + 声明偏移`（第 8 段 `finished` 按实现会在调用观测钩子前返回，故只能从 `fired[]` 读——见 §2.4）；随后渐出窗口内 host 仍在，1s 内完成卸载、撤首帧 class、清定时器与监听、进入终态

### 2.3 契约要求的失败路径逐项对照（全部 PASS）

| 契约要求 | 探针断言（实际输出） |
|---|---|
| 素材失败 | `degraded, not playing` · `no segment played` · `degraded curtain gone in under 1 s` · `a late load cannot re-mount the stage` |
| 素材超时 | `five probes issued` · `degrade starts exactly 1200 ms after mount` · `degraded curtain lifetime is 900 ms` · `custom 300 ms budget is honoured` |
| 客户端抛错 | `exception does not escape` · `state records the failure` · `first-paint class revoked` · `no host mounted` · `body style untouched` |
| 客户端未启动 | `createBootShow({}) is null` · `apply() without ctx.effect does not throw` · `apply() outside a browser does not throw` |
| 重复初始化 | `second call returns the same control` · `only one host element exists` · `dispose removes the single host` |
| 中途 dispose | `dispose tears the stage down` · `clock cleared` · `no further segment fires` · `no host reappears` |
| 迟到回调 | `late callbacks cannot fire segments` · `late callbacks cannot re-mount the stage` · `late callbacks cannot change the terminal state` |
| 首帧 click/Esc | `finished within 150 ms` · `host half end() called once` · `Escape skips the preload phase` · `legacy keyCode 27 also skips` |
| 播放期 click/Esc | `playing at 2.2 s` · `skip finished inside 150 ms` · `later segments are cancelled` · `window Escape finished` |
| 550c 早到/晚到 | `early rival class yields` · `early rival global yields` · `late rival class makes us yield` · `late rival global makes us yield` · `rival class left alone` |
| 清理零残留 | `light-DOM node count is back to the pre-mount value` · `documentElement keeps only the pre-existing app class` · `no plugin host left` · `no plugin <img> left in the light DOM` · `no plugin <style> left in the light DOM` · `no click/keydown listener left` · `no window keydown listener left` · `nothing pending on the clock` · `body overflow restored` |
| 主文档样式污染 | `shadow stylesheet is not a main-document <style>` · `the shadow root does hold exactly one <style>` |
| 宿主半边 | `host subscribes exactly once` · `host pushes three rows` · `row 0 is a style row` · `row 1 is a head script row` · `row 2 is the global hook` · `curtain CSS is scoped to html.dsh-whale-maid-first` · `curtain CSS is a fixed full-bleed overlay` · `curtain CSS keeps the page clickable` · `curtain CSS does not touch body/#root` · `script holds the 550c mutex` · `host script adds no element to the document` · `click/Escape/keyCode 27 retire the curtain` · `host end() is idempotent` · `failed boot card (no spinner) retires the curtain` · `card gone (app mounted) retires the curtain` |

### 2.4 方法透明：我探针先后报出的失败**全部是我自己的假阳性**（已逐条修正）

1. 预载预算用「tick 后的时钟」当起点（差 1ms）；
2. 节点遍历会穿透 shadow root，而真实 `document.querySelectorAll` 不会；
3. 残留计数基线取在挂载之后；
4. 把段**声明偏移**当成墙上时钟；
5. 把修复后的 **800ms 渐出窗口**当成「未进入终态/未清理」；
6. 用 `onSegment` 观察第 8 段，而实现**在 `finished` 分支推送 `fired[]` 后即返回**（不调用观测钩子），因此漏看第 8 段。

修正后（改用 `fired[]` 读 8 段、按渐出窗口判定清理）探针同一次快照上 **149/149 全通过**。这一点也回答了上一版报告遗留的疑点：交付套件的 `PASS all eight segments fired / last segment fired at 6400 ms` 是对的，是我的 harness 观测方式错了。**此前报告中据此提出的「自然结束未清理」结论已撤回，不作为缺陷。**

---

## 3. 其他核查项（本次窗口内这些文件未变，证据仍然有效）

### 3.1 `scripts/preview.html`

存在（17,444 B，`83C4F706…61C6`）；内联全部样式与脚本、唯一相对资源为 `'../lib/client.js'`；`:62`「【动作预览，非真实立绘效果】」、`:76`「两种验收模式」、`:79`「模式 1 · 独立动作预览」、`:87`「模式 2 · 真实素材验收」、`:81`「绝不复制、也绝不重新托管原包素材」、`:89` 仅以文字说明真实路由（对外 http(s) `src/href` 计数 0）；`../lib/client.js` → 包内 `lib/client.js` 真实存在。**通过**。

### 3.2 素材 hash 与 maid-atelier 源码字面比对（只读）

来源：`…\.dsh\profiles\desktop\node_modules\@smalltailqwq\dsh-client-ui-skin-maid-atelier\lib\client.js`（SHA256 `D4EE729DD61341E7190DCA3447522B65685951AFC6EA759A2B4C327412A9E7BA`，3,131 行；只读，未写入）。

| assets.json 键 | 皮肤 `lib/client.js` 行 | 皮肤 manifest `lib/index.js` 行 |
|---|---|---|
| `maid-left` | 38 | 58 |
| `maid-right` | 39 | 69 |
| `palace-light` | 36 | 65 |
| `palace-dark` | 37 | 73 |
| `chibi` | 18 | 62 |
| `vision` | 56 | 71 |

6/6 字面命中（`Select-String -SimpleMatch`）。**通过**。

### 3.3 README 署名链 / LICENSE 分层 / `package.json` license

README（`C67FCE3B…`）：`:52` §3 署名与许可；`:56`/`:58` 素材 CC BY-NC-SA 4.0；**`:60` 三创链「上善（一创）→ ZipZipPipe（二创）→ Small-tailqwq（三创）」**；`:62`/`:63` 两个 pixiv 链接；`:71`「只用 URL ≠ 免除许可义务」；`:73` SA 义务；`:77` 代码 MIT。
LICENSE（`0F89A5C6…`，102 行）：MIT（代码）＋ CC BY-NC-SA 4.0（素材）分层；`package.json` `license = "MIT AND CC-BY-NC-SA-4.0"`、`files` 含 `LICENSE`（主控登记的两项已修）。**通过**。

### 3.4 主文档样式污染

探针 L 段：样式只存在于自有 shadow root（light DOM `<style>` 计数 0、shadow 内恰好 1 个）；退场后 light DOM 节点数回到挂载前、`documentElement` 只剩预置业务 class、本插件 host/img/style/监听/定时器全为 0、`body` 的 `overflow` 恢复。**通过**（假 DOM 结论；真实浏览器层叠见 §4）。

### 3.5 `~/.dsh/profiles/desktop` 对照证据（只读）

- 递归文件总数 **4,026**；最新 8 个：`.dsh-market\state.json` 21:58:37.851、`.dsh-market\log.ndjson` 21:44:11.752、`package.json` 21:44:11.552、`.plugin-manager\logs\operation-dBkGbm\pnpm.log` 21:44:11.480、`node_modules\.pnpm-workspace-state-v1.json` 21:44:11.465、`node_modules\.pnpm\lock.yaml` 21:44:11.434、`node_modules\.modules.yaml` 21:44:11.430、`pnpm-lock.yaml` 21:44:11.231
- 晚于本次插件窗口（21:57 起）的写入只有 1 个：`.dsh-market\state.json`（market 插件自身 UI 状态 disabled/favorites/notes/region，**不含本插件任何标识**）
- 路径含 `whale-maid` 的文件数 **0**；四份 profile 配置（mtime 21:37–21:44）中无 `whale`/`maid`/`boot-whale` 引用
- 结论：**本包从未被安装/复制/写入 profile desktop**；本插件交付物只落工作区。**通过**（唯一注意项已列明）

---

## 4. 未验证项（明确边界）

1. 真实素材美术效果（立绘/宫殿/Q 版观感与构图）
2. 真实浏览器布局、字体、合成与 ≤720px 窄屏适配（含标题盒与左右立绘是否真互相压盖——capture A 的 `the reserved title box starts right of the left sprite` 属几何断言，离线只算了盒模型）
3. 安装到 profile 后的真实开机实测（首帧是否真盖住 `[data-dsh-boot]`、与 550c 实机互斥、跳过手感、交接无接缝）
4. CSS 层叠语义（假 DOM 不解析样式表；本报告只做结构/时序/清理判定）
5. 真实网络 404 行为（只用模拟 `error`/超时复现）
6. `preview.html` 在 `file://` 与静态服务器下的真实打开效果
7. 上游 NOTICE / LICENSE-ARTWORK 原文比对（本报告只核 hash 字面命中与 README/LICENSE 口径）
8. **最终修订的绿灯**：`assert.mjs` 必须由修复方收口后，在冻结修订上复跑 §1 四条命令 + §2 探针

---

## 5. 交给实现者的问题清单

| id | 严重度 | 问题 | 要求 |
|---|---|---|---|
| **V1** | blocker | `node scripts/assert.mjs` **exit 1**：capture A（`B58344F1…`）`checks: 402, failures: 2`（`the host is opaque for phases 0..5`、`the reserved title box starts right of the left sprite`）；capture B（`F6F43D40…`）`checks: 407, failures: 15`，失败以 `got null` 为主（标题字、幕布面板各阶段、降级/减动标题开关等元素取不到）。套件在 65 秒内被改写两次且红态扩大 | 先让实现与断言口径一致（`got null` 族表明断言引用了实现里不存在的节点/属性），再在冻结修订上复跑至 exit 0 并保留输出 |
| **V2** | withdrawn | 我上一版报告提出的「自然结束未进入终态/未清理」与「第 8 段未触发」两条已**撤回**：证实是我探针的 harness 错误（`onSegment` 在 `finished` 分支被跳过；把声明偏移当墙钟；把 800ms 渐出窗口当异常）。修正后探针在 `client.js 440E7357…` 上 **149/149 全通过** | 修复方无需按这两条改动 |
| **V3** | info | 已在此修订验证为**正常**、无需再改：两条 `--check` exit 0；`smoke.mjs` 74/74（清单字段 + apply() 注册）；1200ms 预载预算、900ms 降级幕、自定义 300ms 精确命中；客户端与宿主半边 8000ms 上限一致且实测生效；素材失败/超时/抛错/未启动/重复初始化/中途 dispose/迟到回调/首帧与播放期点击与 Esc/550c 早到与晚到全部通过；清理零残留；6/6 素材 hash 与皮肤源码字面一致；preview 两种模式说明完整；profile 未被污染 | t14 在冻结点重跑 §1 四条命令 + §2 探针（附录 A）即可 |
| **V4** | 主控决策（info） | 并发打包产物仍在包内：`.gitignore`(22:26:47)、`.npm-cache/`、`.packcheck/`(22:27:03)、`dist/dsh-plugin-boot-whale-maid-0.1.0.tgz`(85,571 B，`09816FB8…`)；另有其他成员新增的 `docs/RELEASE.md`。`dist/*.tgz` 会随工作区被外部看到 | 建议主控明确 `dist/`、`.packcheck/`、`.npm-cache/` 是否保留在交付目录 |

---

## 附录 A：独立探针源码

本次实测所用探针文件的 SHA256 为 `72FAAA39AEC6DBED9D6D208F4EAE70AA51456B3D97628C36D7E0E86B326BCA54`（618 行 / 31,902 字节），与冻结快照 `client.js 440E7357…C315` + `index.js BA8B0EE9…D1A6` 配套。下面完整抄录，可另存为 `t12-probe.mjs` 后按 §2.1 复跑：

```js
/**
 * t12 independent probe — written by 离线验证与评审, NOT a delivery file.
 *
 * It re-checks the failure paths the contract names, with its own hand-rolled
 * fake DOM / fake clock, and never touches dsh-plugin-boot-whale-maid/*.
 *
 * usage: node t12-probe.mjs <path-to-client.js> <path-to-index.js>
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const CLIENT = process.argv[2];
const HOST = process.argv[3];

let checks = 0;
let failures = 0;
function section(t) { process.stdout.write('\n== ' + t + '\n'); }
function check(label, cond, detail) {
  checks += 1;
  if (cond) { process.stdout.write('  PASS  ' + label + '\n'); return true; }
  failures += 1;
  process.stdout.write('  FAIL  ' + label + (detail === undefined ? '' : ' :: ' + detail) + '\n');
  return false;
}
function eq(label, a, b) { return check(label, Object.is(a, b), 'expected ' + String(b) + ', got ' + String(a)); }

/* ---------------------------------------------------------------- fake DOM */

const SVG = 'http://www.w3.org/2000/svg';

class FakeStyle {
  constructor() { this._p = new Map(); this.cssText = ''; }
  setProperty(n, v) { this._p.set(String(n), String(v)); }
  getPropertyValue(n) { return this._p.has(String(n)) ? this._p.get(String(n)) : ''; }
  removeProperty(n) { this._p.delete(String(n)); }
}

class El {
  constructor(doc, tag, ns) {
    this.ownerDocument = doc; this.tagName = String(tag).toLowerCase(); this.namespaceURI = ns || null;
    this.childNodes = []; this.parentNode = null; this.attributes = new Map(); this.listeners = new Map();
    this.style = new FakeStyle(); this.className = ''; this.textContent = ''; this.shadowRoot = null;
    this.complete = false; this.naturalWidth = 0;
    this.classList = {
      contains: (c) => this.className.split(/\s+/).indexOf(String(c)) !== -1,
      add: (c) => { const s = this.className.split(/\s+/).filter(Boolean); if (s.indexOf(String(c)) === -1) s.push(String(c)); this.className = s.join(' '); },
      remove: (c) => { this.className = this.className.split(/\s+/).filter((x) => x && x !== String(c)).join(' '); },
    };
  }
  appendChild(n) { if (!n) return n; if (n.parentNode && n.parentNode.removeChild) n.parentNode.removeChild(n); this.childNodes.push(n); n.parentNode = this; return n; }
  removeChild(n) { const i = this.childNodes.indexOf(n); if (i !== -1) { this.childNodes.splice(i, 1); n.parentNode = null; } return n; }
  setAttribute(k, v) {
    k = String(k); this.attributes.set(k, v === undefined || v === null ? '' : String(v));
    if (k === 'class') this.className = String(v);
    if (k === 'src' && this.tagName === 'img') this._onSrc(String(v));
  }
  getAttribute(k) { k = String(k); return this.attributes.has(k) ? this.attributes.get(k) : null; }
  hasAttribute(k) { return this.attributes.has(String(k)); }
  removeAttribute(k) { this.attributes.delete(String(k)); }
  addEventListener(t, fn) { t = String(t); if (!this.listeners.has(t)) this.listeners.set(t, []); this.listeners.get(t).push(fn); }
  removeEventListener(t, fn) { t = String(t); const l = this.listeners.get(t); if (!l) return; const i = l.indexOf(fn); if (i !== -1) l.splice(i, 1); if (!l.length) this.listeners.delete(t); }
  listenerCount(t) { const l = this.listeners.get(String(t)); return l ? l.length : 0; }
  dispatchEvent(e) { (this.listeners.get(String(e.type)) || []).slice().forEach((fn) => fn(e)); return true; }
  attachShadow() { if (!this.shadowRoot) this.shadowRoot = new El(this.ownerDocument, '#shadow-root'); return this.shadowRoot; }
  walk(fn) { fn(this); this.childNodes.forEach((c) => c.walk(fn)); if (this.shadowRoot) this.shadowRoot.walk(fn); }
  matches(sel) {
    sel = String(sel).trim();
    if (sel.charAt(0) === '.') return String(this.className || '').split(/\s+/).indexOf(sel.slice(1)) !== -1;
    if (sel.charAt(0) === '[') return this.hasAttribute(sel.slice(1, -1).split('=')[0]);
    return this.tagName === sel.toLowerCase();
  }
  querySelector(sel) { let f = null; this.walk((n) => { if (!f && n !== this && n.matches(sel)) f = n; }); return f; }
  querySelectorAll(sel) { const out = []; this.walk((n) => { if (n !== this && n.matches(sel)) out.push(n); }); return out; }
  _onSrc() {
    const doc = this.ownerDocument; doc._images.push(this);
    if (this.listenerCount('load') + this.listenerCount('error') === 0) return;
    doc._probes.push(this);
    if (doc._imageBehaviour === 'fail') { this.__settled = true; this.dispatchEvent({ type: 'error', target: this }); }
    else if (doc._imageBehaviour === 'ok') { this.__settled = true; this.complete = true; this.naturalWidth = 4; this.dispatchEvent({ type: 'load', target: this }); }
  }
}

class FakeDocument {
  constructor() {
    this.documentElement = new El(this, 'html'); this.body = new El(this, 'body');
    this.documentElement.appendChild(this.body);
    this.defaultView = null; this.baseURI = 'http://127.0.0.1:19387/';
    this.listeners = new Map(); this._images = []; this._probes = []; this._imageBehaviour = 'pending';
  }
  createElement(t) { return new El(this, t); }
  createElementNS(ns, t) { return new El(this, t, ns); }
  addEventListener(t, fn) { t = String(t); if (!this.listeners.has(t)) this.listeners.set(t, []); this.listeners.get(t).push(fn); }
  removeEventListener(t, fn) { t = String(t); const l = this.listeners.get(t); if (!l) return; const i = l.indexOf(fn); if (i !== -1) l.splice(i, 1); if (!l.length) this.listeners.delete(t); }
  listenerCount(t) { const l = this.listeners.get(String(t)); return l ? l.length : 0; }
  dispatchEvent(e) { (this.listeners.get(String(e.type)) || []).slice().forEach((fn) => fn(e)); return true; }
  querySelector(sel) { return this.documentElement.querySelector(sel); }
  querySelectorAll(sel) { return this.documentElement.querySelectorAll(sel); }
  settle(ok) {
    this._probes.slice().forEach((img) => {
      if (img.__settled) return;
      img.__settled = true; img.complete = true; img.naturalWidth = ok ? 4 : 0;
      img.dispatchEvent({ type: ok ? 'load' : 'error', target: img });
    });
  }
}

class FakeWindow {
  constructor(doc) {
    this.document = doc; this.innerWidth = 1920; this.innerHeight = 1080; this.listeners = new Map();
    this.matchMedia = () => ({ matches: false });
  }
  addEventListener(t, fn) { t = String(t); if (!this.listeners.has(t)) this.listeners.set(t, []); this.listeners.get(t).push(fn); }
  removeEventListener(t, fn) { t = String(t); const l = this.listeners.get(t); if (!l) return; const i = l.indexOf(fn); if (i !== -1) l.splice(i, 1); if (!l.length) this.listeners.delete(t); }
  listenerCount(t) { const l = this.listeners.get(String(t)); return l ? l.length : 0; }
  dispatchEvent(e) { (this.listeners.get(String(e.type)) || []).slice().forEach((fn) => fn(e)); return true; }
}

class FakeClock {
  constructor() { this.now = 0; this.seq = 0; this.tasks = new Map(); }
  setTimeout(fn, ms) { this.seq += 1; this.tasks.set(this.seq, { at: this.now + (Number(ms) || 0), seq: this.seq, fn }); return this.seq; }
  clearTimeout(id) { this.tasks.delete(id); }
  get pending() { return this.tasks.size; }
  tick(ms) {
    const target = this.now + (Number(ms) || 0);
    for (;;) {
      let next = null;
      this.tasks.forEach((t) => { if (t.at > target) return; if (!next || t.at < next.at || (t.at === next.at && t.seq < next.seq)) next = t; });
      if (!next) break;
      this.tasks.delete(next.seq); this.now = next.at; next.fn();
    }
    this.now = target; return this;
  }
}

function env(opts) {
  const o = opts || {};
  const doc = new FakeDocument(); const win = new FakeWindow(doc); doc.defaultView = win;
  win.innerWidth = o.width || 1920; win.innerHeight = o.height || 1080;
  const classes = [];
  if (o.rivalClass) classes.push('dsh550c-first');
  if (o.firstPaint !== false) classes.push('dsh-whale-maid-first');
  if (o.extraClass) classes.push(o.extraClass);
  doc.documentElement.className = classes.join(' '); doc.documentElement.classList.className = doc.documentElement.className;
  if (o.rivalGlobal) win.__dsh550cBoot = {};
  const clock = new FakeClock();
  return { doc, win, clock };
}
const hosts = (doc) => doc.querySelectorAll('.dsh-whale-maid-boot-host');
const shadowOf = (doc) => { const h = hosts(doc); return h.length ? h[0].shadowRoot : null; };
const inShadow = (doc, sel) => { const s = shadowOf(doc); return s ? s.querySelector(sel) : null; };
const paint = (doc) => String(doc.documentElement.className).split(/\s+/).includes('dsh-whale-maid-first');
/* light DOM only: a real document.querySelectorAll never pierces shadow roots */
function lightWalk(doc, fn) { const go = (n) => { fn(n); n.childNodes.forEach(go); }; go(doc.documentElement); }
const lightCount = (doc) => { let n = 0; lightWalk(doc, () => { n += 1; }); return n; };
const lightTags = (doc, tag) => { let n = 0; lightWalk(doc, (x) => { if (x.tagName === tag) n += 1; }); return n; };

/* ------------------------------------------------------------ load modules */

const { createBootShow, apply, BOOT_SEGMENTS, STAGE_CONFIG } = await import(pathToFileURL(CLIENT).href);
const hostMod = await import(pathToFileURL(HOST).href);

process.stdout.write('probe target client.js: ' + CLIENT + '\n');
process.stdout.write('probe target index.js : ' + HOST + '\n');

/* ------------------------------------------- A. client not started / throws */

section('A. client not started, invalid args, apply()');
eq('createBootShow({}) is null', createBootShow({}), null);
eq('createBootShow({document:null}) is null', createBootShow({ document: null }), null);
{
  let threw = false; let h = null;
  try { h = apply({}); } catch (_e) { threw = true; }
  check('apply() without ctx.effect does not throw', !threw);
  check('apply() returns a disposable handle', !!h && typeof h.dispose === 'function');
  try { h.dispose(); } catch (_e) { /* ignore */ }
}
{
  let threw = false;
  try { apply({ effect: (fn) => { const d = fn(); return () => { if (typeof d === 'function') d(); }; } }); } catch (_e) { threw = true; }
  check('apply() outside a browser does not throw', !threw);
}

/* ---------------------------------------------- B. repeated init / adoption */

section('B. repeated initialisation adopts the stage');
{
  const e = env();
  const a = createBootShow({ document: e.doc, window: e.win, clock: e.clock });
  const b = createBootShow({ document: e.doc, window: e.win, clock: e.clock });
  check('second call returns the same control', a === b);
  eq('only one host element exists', hosts(e.doc).length, 1);
  a.dispose();
  eq('dispose removes the single host', hosts(e.doc).length, 0);
  e.clock.tick(10000);
  eq('nothing reappears after dispose', hosts(e.doc).length, 0);
}

/* ------------------------------------------- C. first-paint click / Escape */

section('C. click / Escape in the first-paint phase (<=150 ms)');
{
  const e = env(); let ends = 0; e.win.__dshWhaleMaidBoot = { end() { ends += 1; } };
  const boot = createBootShow({ document: e.doc, window: e.win, clock: e.clock });
  e.doc.dispatchEvent({ type: 'click', target: e.doc.body });
  eq('click enters skipping immediately', boot.state, 'skipping');
  e.clock.tick(139);
  check('still skipping at 139 ms', boot.state === 'skipping', boot.state);
  e.clock.tick(2);
  eq('finished within 150 ms', boot.state, 'skipped');
  eq('host removed', hosts(e.doc).length, 0);
  check('first-paint class cleared', !paint(e.doc));
  eq('no listener left on the document', e.doc.listenerCount('click'), 0);
  eq('no timer left on the clock', e.clock.pending, 0);
  check('host half end() called once', ends === 1, 'calls=' + ends);

  const e2 = env();
  const b2 = createBootShow({ document: e2.doc, window: e2.win, clock: e2.clock });
  e2.clock.tick(5);
  e2.doc.dispatchEvent({ type: 'keydown', key: 'Escape' });
  eq('Escape skips the preload phase', b2.state, 'skipping');
  e2.clock.tick(150);
  eq('Escape finished inside 150 ms', b2.state, 'skipped');
  eq('Escape left no timer', e2.clock.pending, 0);

  const e3 = env();
  const b3 = createBootShow({ document: e3.doc, window: e3.win, clock: e3.clock });
  e3.clock.tick(5);
  e3.doc.dispatchEvent({ type: 'keydown', keyCode: 27 });
  eq('legacy keyCode 27 also skips', b3.state, 'skipping');
}

/* -------------------------------------------------- D. click while playing */

section('D. click / Escape while playing');
{
  const e = env(); let ends = 0; e.win.__dshWhaleMaidBoot = { end() { ends += 1; } };
  const boot = createBootShow({ document: e.doc, window: e.win, clock: e.clock });
  e.clock.tick(50); e.doc.settle(true); e.clock.tick(2200);
  eq('playing at 2.2 s', boot.state, 'playing');
  const before = boot.fired.length;
  e.doc.dispatchEvent({ type: 'click', target: e.doc.body });
  eq('click during playback enters skipping', boot.state, 'skipping');
  e.clock.tick(20);
  eq('later segments are cancelled', boot.fired.length, before);
  e.clock.tick(130);
  eq('skip finished inside 150 ms', boot.state, 'skipped');
  eq('host gone', hosts(e.doc).length, 0);
  check('first-paint class gone', !paint(e.doc));
  eq('no timer surviving the skip', e.clock.pending, 0);
  check('end() called once', ends === 1, 'calls=' + ends);

  const e2 = env();
  const b2 = createBootShow({ document: e2.doc, window: e2.win, clock: e2.clock });
  e2.clock.tick(50); e2.doc.settle(true); e2.clock.tick(3000);
  eq('second stage is playing', b2.state, 'playing');
  e2.win.dispatchEvent({ type: 'keydown', key: 'Escape' });
  eq('window Escape skips', b2.state, 'skipping');
  e2.clock.tick(150);
  eq('window Escape finished', b2.state, 'skipped');
  eq('second stage left no host', hosts(e2.doc).length, 0);
}

/* ------------------------------------------------- E. artwork failure / 404 */

section('E. artwork failure -> degraded curtain, nothing re-mounts');
{
  const e = env(); let ends = 0; e.win.__dshWhaleMaidBoot = { end() { ends += 1; } };
  const boot = createBootShow({ document: e.doc, window: e.win, clock: e.clock });
  e.clock.tick(50); e.doc._imageBehaviour = 'fail'; e.doc.settle(false);
  eq('degraded, not playing', boot.state, 'degrade');
  eq('no segment played', boot.fired.length, 0);
  eq('stage marked degrade', inShadow(e.doc, '.stage').getAttribute('data-mode'), 'degrade');
  e.clock.tick(899);
  check('degraded curtain still up just before 900 ms', boot.state === 'degrade', boot.state);
  e.clock.tick(2);
  eq('degraded curtain gone in under 1 s', boot.state, 'degraded');
  eq('host removed', hosts(e.doc).length, 0);
  check('first-paint class cleared', !paint(e.doc));
  check('end() called once', ends === 1, 'calls=' + ends);
  e.doc._imageBehaviour = 'ok';
  e.clock.tick(5000); e.doc.settle(true);
  eq('a late load cannot re-mount the stage', hosts(e.doc).length, 0);
  eq('state stays terminal', boot.state, 'degraded');
}

/* --------------------------------------------------- F. artwork budget 1200 */

section('F. preload budget (default 1200 ms, custom 300 ms)');
{
  const e = env();
  const mountAt = e.clock.now;
  const boot = createBootShow({ document: e.doc, window: e.win, clock: e.clock });
  e.clock.tick(1);
  eq('five probes issued', e.doc._probes.length, 5);
  check('no degrade before the budget expires', boot.state === 'preload', boot.state);
  let degradeAt = -1;
  for (let t = 0; t < 1400; t += 1) {
    e.clock.tick(1);
    if (boot.state === 'degrade') { degradeAt = e.clock.now; break; }
  }
  eq('degrade starts exactly 1200 ms after mount', degradeAt - mountAt, 1200);
  const deAt = degradeAt;
  let goneAt = -1;
  for (let t = 0; t < 1200; t += 1) {
    e.clock.tick(1);
    if (boot.state !== 'degrade') { goneAt = e.clock.now; break; }
  }
  eq('degraded curtain lifetime is 900 ms', goneAt - deAt, 900);
  eq('host removed after degrade', hosts(e.doc).length, 0);

  const e2 = env();
  const mount2 = e2.clock.now;
  const b2 = createBootShow({ document: e2.doc, window: e2.win, clock: e2.clock, preloadBudgetMs: 300 });
  e2.clock.tick(1);
  let d2 = -1;
  for (let t = 0; t < 500; t += 1) { e2.clock.tick(1); if (b2.state === 'degrade') { d2 = e2.clock.now; break; } }
  eq('custom 300 ms budget is honoured', d2 - mount2, 300);
}

/* ------------------------------------------- G. throwing animation body */

section('G. a throwing build still revokes the first frame');
{
  const e = env(); let ends = 0; e.win.__dshWhaleMaidBoot = { end() { ends += 1; } };
  let threw = false; let boot = null;
  try { boot = createBootShow({ document: e.doc, window: e.win, clock: e.clock, failBuild: true }); } catch (_err) { threw = true; }
  check('exception does not escape', !threw);
  check('control object is still returned', !!boot);
  eq('state records the failure', boot.state, 'error');
  check('first-paint class revoked', !paint(e.doc));
  check('end() hook ran', ends === 1, 'calls=' + ends);
  eq('no host mounted', hosts(e.doc).length, 0);
  eq('no timer left', e.clock.pending, 0);
  eq('no document listener left', e.doc.listenerCount('click'), 0);
  eq('body style untouched', e.doc.body.style.getPropertyValue('overflow'), '');
}

/* ------------------------------- H. dispose mid-flight + I. late callbacks */

section('H. dispose mid-flight / I. late callbacks are inert');
{
  const e = env();
  const boot = createBootShow({ document: e.doc, window: e.win, clock: e.clock });
  e.clock.tick(50); e.doc.settle(true); e.clock.tick(700);
  eq('playing at 0.7 s', boot.state, 'playing');
  boot.dispose();
  eq('dispose tears the stage down', boot.state, 'dispose');
  eq('host removed', hosts(e.doc).length, 0);
  eq('clock cleared', e.clock.pending, 0);
  const fired = boot.fired.length;
  e.clock.tick(10000);
  eq('no further segment fires', boot.fired.length, fired);
  eq('no host reappears', hosts(e.doc).length, 0);

  const e2 = env();
  const stale = [];
  const real = new FakeClock();
  const sneaky = {
    setTimeout(fn, ms) { return real.setTimeout(() => stale.push(fn), ms); },
    clearTimeout() { /* deliberately cannot cancel */ },
  };
  const b2 = createBootShow({ document: e2.doc, window: e2.win, clock: sneaky });
  real.tick(50); e2.doc.settle(true); real.tick(450);
  b2.dispose();
  const before = b2.fired.length;
  real.tick(20000);
  stale.forEach((fn) => fn());
  eq('late callbacks cannot fire segments', b2.fired.length, before);
  eq('late callbacks cannot re-mount the stage', hosts(e2.doc).length, 0);
  eq('late callbacks cannot change the terminal state', b2.state, 'dispose');
  check('late callbacks leave the first-paint class cleared', !paint(e2.doc));
}

/* ------------------------------------------------- J. 550c mutex both ways */

section('J. 550c mutual exclusion (early by class/global, late by class/global)');
{
  const a = env({ rivalClass: true });
  const ba = createBootShow({ document: a.doc, window: a.win, clock: a.clock });
  eq('early rival class yields', ba.state, 'yield-550c');
  eq('no stage mounted', hosts(a.doc).length, 0);
  eq('nothing scheduled', a.clock.pending, 0);
  eq('rival class untouched', a.doc.documentElement.className, 'dsh550c-first');

  const b = env({ rivalGlobal: true });
  const bb = createBootShow({ document: b.doc, window: b.win, clock: b.clock });
  eq('early rival global yields', bb.state, 'yield-550c');
  eq('no stage for the rival global', hosts(b.doc).length, 0);

  const c = env(); let ends = 0; c.win.__dshWhaleMaidBoot = { end() { ends += 1; } };
  const bc = createBootShow({ document: c.doc, window: c.win, clock: c.clock });
  c.clock.tick(50); c.doc.settle(true); c.clock.tick(1150);
  eq('our stage plays before the rival appears', bc.state, 'playing');
  c.doc.documentElement.classList.add('dsh550c-first');
  c.clock.tick(250);
  eq('late rival class makes us yield', bc.state, 'yield-550c');
  eq('our host removed', hosts(c.doc).length, 0);
  check('our first-paint class cleared', !paint(c.doc));
  check('rival class left alone', c.doc.documentElement.classList.contains('dsh550c-first'));
  check('host half end() called', ends === 1, 'calls=' + ends);

  const d = env();
  const bd = createBootShow({ document: d.doc, window: d.win, clock: d.clock });
  d.clock.tick(50); d.doc.settle(true); d.clock.tick(850);
  d.win.__dsh550cBoot = { private: true };
  d.clock.tick(250);
  eq('late rival global makes us yield', bd.state, 'yield-550c');
  eq('late global yield removes our host', hosts(d.doc).length, 0);
}

/* ---------------------------------------------- K. measured 8000 ms ceiling */

section('K. measured hard ceiling of the stage (stalled probe)');
{
  const e = env();
  const boot = createBootShow({ document: e.doc, window: e.win, clock: e.clock, preloadBudgetMs: 1000000 });
  let terminalAt = -1;
  for (let t = 0; t < 12000; t += 1) { e.clock.tick(1); if (boot.state !== 'preload' && boot.state !== 'playing') { terminalAt = e.clock.now; break; } }
  check('the stalled stage is torn down by a hard cap', terminalAt > 0, 'state=' + boot.state);
  process.stdout.write('  INFO  stage torn down ' + terminalAt + ' ms after mount (state=' + boot.state + ')\n');
  eq('host removed by the cap', hosts(e.doc).length, 0);
  check('first-paint class cleared by the cap', !paint(e.doc));
  eq('no timer left by the cap', e.clock.pending, 0);
}

/* -------------------------------------------- L. no residue after teardown */

section('L. main-document pollution / residue after teardown');
{
  const e = env({ extraClass: 'app-shell' });
  const nodesBefore = lightCount(e.doc);
  const boot = createBootShow({ document: e.doc, window: e.win, clock: e.clock });
  check('shadow stylesheet is not a main-document <style>', lightTags(e.doc, 'style') === 0);
  check('the shadow root does hold exactly one <style>', shadowOf(e.doc).querySelectorAll('style').length === 1);
  e.clock.tick(50); e.doc.settle(true); e.clock.tick(700);
  const boot2 = createBootShow({ document: e.doc, window: e.win, clock: e.clock });
  check('adopted control is the same object', boot2 === boot);
  boot.dispose();
  eq('light-DOM node count is back to the pre-mount value', lightCount(e.doc), nodesBefore);
  eq('no plugin host left', e.doc.querySelectorAll('.dsh-whale-maid-boot-host').length, 0);
  eq('no plugin <img> left in the light DOM', lightTags(e.doc, 'img'), 0);
  eq('no plugin <style> left in the light DOM', lightTags(e.doc, 'style'), 0);
  check('no first-paint class left', !paint(e.doc));
  eq('documentElement keeps only the pre-existing app class', e.doc.documentElement.className, 'app-shell');
  eq('body overflow restored', e.doc.body.style.getPropertyValue('overflow'), '');
  eq('no click listener left', e.doc.listenerCount('click'), 0);
  eq('no keydown listener left', e.doc.listenerCount('keydown'), 0);
  eq('no window keydown listener left', e.win.listenerCount('keydown'), 0);
  eq('nothing pending on the clock', e.clock.pending, 0);
}

/* ------------------------------------------------- M. segment table sanity */

section('M. segment table + skip budget (values, not prose)');
{
  eq('eight segments', BOOT_SEGMENTS.length, 8);
  eq('segment start times', JSON.stringify(BOOT_SEGMENTS.map((s) => s.at)), JSON.stringify([0, 500, 1800, 2050, 3200, 4400, 5600, 6400]));
  eq('right mascot offset', BOOT_SEGMENTS[3].at - BOOT_SEGMENTS[2].at, 250);
  check('skip budget <= 150 ms', STAGE_CONFIG.skipFadeMs <= 150, String(STAGE_CONFIG.skipFadeMs));
}

/* ------------------------------------------------------- N. host half ---- */

section('N. host half: injection rows, curtain behaviour, 550c, failsafe');
{
  const rows = []; const subs = [];
  const ctx = { on(ev, fn) { subs.push(ev); if (ev === 'webserver/index-inject') fn(rows); } };
  let threw = false;
  try { hostMod.apply(ctx); } catch (_e) { threw = true; }
  check('host apply() does not throw', !threw);
  eq('host subscribes exactly once', subs.length, 1);
  eq('host subscription event', subs[0], 'webserver/index-inject');
  eq('host pushes three rows', rows.length, 3);
  eq('row 0 is a style row', rows[0] && rows[0].kind, 'style');
  eq('row 1 is a head script row', rows[1] && rows[1].kind + '/' + rows[1].placement, 'script/head');
  eq('row 2 is the global hook', rows[2] && rows[2].kind, 'global');
  const css = rows[0].text; const js = rows[1].text;
  check('curtain CSS is scoped to html.dsh-whale-maid-first', css.includes('html.dsh-whale-maid-first::before'));
  check('curtain CSS is a fixed full-bleed overlay', css.includes('position:fixed') && css.includes('inset:0'));
  check('curtain CSS keeps the page clickable', css.includes('pointer-events:none'));
  check('curtain CSS does not touch body/#root', !/\bbody\b/.test(css) && !/#root/.test(css));
  check('script references the boot card contract', js.includes('[data-dsh-boot]') && js.includes('[data-dsh-boot-spinner]'));
  check('script holds the 550c mutex', js.includes('dsh550c-first') && js.includes('__dsh550cBoot'));
  check('script holds a failsafe ceiling', js.includes('8000'));

  const mkDoc = () => {
    const d = new FakeDocument(); const w = new FakeWindow(d); d.defaultView = w;
    const clock = new FakeClock();
    w.setTimeout = (fn, ms) => clock.setTimeout(fn, ms);
    w.clearTimeout = (id) => clock.clearTimeout(id);
    w.setInterval = (fn, ms) => { const id = clock.setTimeout(function again() { fn(); clock.setTimeout(again, ms); }, ms); return id; };
    w.clearInterval = (id) => clock.clearTimeout(id);
    d.documentElement.classList.className = '';
    return { d, w, clock };
  };
  const run = (t) => {
    const e = mkDoc();
    new Function('document', 'window', t)(e.d, e.w);
    return e;
  };

  {
    const e = mkDoc();
    const before = lightCount(e.d);
    new Function('document', 'window', js)(e.d, e.w);
    check('host script puts the state class on documentElement', e.d.documentElement.classList.contains('dsh-whale-maid-first'));
    eq('host script adds no element to the document', lightCount(e.d), before);
    check('handshake hook installed', typeof e.w.__dshWhaleMaidBoot === 'object' && typeof e.w.__dshWhaleMaidBoot.end === 'function');
    check('click retires the curtain', (() => { e.d.dispatchEvent({ type: 'click' }); return !e.d.documentElement.classList.contains('dsh-whale-maid-first'); })());
    eq('host end() is idempotent', (() => { e.w.__dshWhaleMaidBoot.end(); e.w.__dshWhaleMaidBoot.end(); return e.w.__dshWhaleMaidBoot.state().ended; })(), true);
    eq('host click listener removed by end()', e.d.listenerCount('click'), 0);
  }
  {
    const e = run(js);
    e.d.dispatchEvent({ type: 'keydown', key: 'Escape' });
    check('Escape retires the curtain', !e.d.documentElement.classList.contains('dsh-whale-maid-first'));
  }
  {
    const e = run(js);
    e.d.dispatchEvent({ type: 'keydown', keyCode: 27 });
    check('keyCode 27 retires the curtain', !e.d.documentElement.classList.contains('dsh-whale-maid-first'));
  }
  {
    const e = mkDoc();
    e.d.documentElement.classList.add('dsh550c-first');
    new Function('document', 'window', js)(e.d, e.w);
    check('early rival class: host adds no curtain class', !e.d.documentElement.classList.contains('dsh-whale-maid-first'));
    check('early rival class: host installs no hook', !e.w.__dshWhaleMaidBoot);
    eq('early rival class: host installs no listener', e.d.listenerCount('click'), 0);
    check('early rival class untouched', e.d.documentElement.classList.contains('dsh550c-first'));
  }
  {
    const e = mkDoc(); e.w.__dsh550cBoot = {};
    new Function('document', 'window', js)(e.d, e.w);
    check('early rival global: host adds no curtain class', !e.d.documentElement.classList.contains('dsh-whale-maid-first'));
  }
  {
    const e = run(js);
    e.d.documentElement.classList.add('dsh550c-first');
    e.clock.tick(120);
    check('late rival class retires our curtain', !e.d.documentElement.classList.contains('dsh-whale-maid-first'));
    check('late rival class left alone', e.d.documentElement.classList.contains('dsh550c-first'));
  }
  {
    const e = run(js);
    e.w.__dsh550cBoot = {};
    e.clock.tick(120);
    check('late rival global retires our curtain', !e.d.documentElement.classList.contains('dsh-whale-maid-first'));
  }
  {
    const e = run(js);
    const card = e.d.createElement('div'); card.setAttribute('data-dsh-boot', '');
    e.d.documentElement.appendChild(card);
    e.clock.tick(120);
    check('failed boot card (no spinner) retires the curtain', !e.d.documentElement.classList.contains('dsh-whale-maid-first'));
  }
  {
    const e = run(js);
    const card = e.d.createElement('div'); card.setAttribute('data-dsh-boot', '');
    const spin = e.d.createElement('div'); spin.setAttribute('data-dsh-boot-spinner', ''); card.appendChild(spin);
    e.d.documentElement.appendChild(card);
    e.clock.tick(120); e.clock.tick(120);
    check('card with spinner keeps the curtain up', e.d.documentElement.classList.contains('dsh-whale-maid-first'));
    e.d.documentElement.removeChild(card);
    e.clock.tick(120);
    check('card gone (app mounted) retires the curtain', !e.d.documentElement.classList.contains('dsh-whale-maid-first'));
  }
  {
    const e = run(js);
    let retiredAt = -1;
    for (let t = 0; t < 9000; t += 1) { e.clock.tick(1); if (!e.d.documentElement.classList.contains('dsh-whale-maid-first')) { retiredAt = e.clock.now; break; } }
    eq('host failsafe ceiling is exactly 8000 ms', retiredAt, 8000);
  }
}

section('O. the show ends itself at +6400 ms after its own zero');
{
  const e = env();
  const seen = [];
  const boot = createBootShow({
    document: e.doc, window: e.win, clock: e.clock,
    onSegment: (seg) => { seen.push({ id: seg.id, now: e.clock.now }); },
  });
  e.clock.tick(50);
  e.doc.settle(true);
  // NOTE: the terminal `finished` segment deliberately returns before the
  // observation hook, so the eighth segment can only be read from `fired[]`.
  while (boot.fired.length < 8 && e.clock.now < 20000) e.clock.tick(1);
  eq('all eight segments are recorded in fired[]', boot.fired.length, 8);
  const EXPECT = [0, 500, 1800, 2050, 3200, 4400, 5600, 6400];
  check('fired[] ids and declared offsets match the table',
    boot.fired.length === 8 && boot.fired.every((f, i) => f.id === BOOT_SEGMENTS[i].id && f.at === EXPECT[i]),
    JSON.stringify(boot.fired.map((f) => f.id + '@' + f.at)));
  const zero = seen.length ? seen[0].now : -1;
  check('the seven observed effect segments fired at zero + their declared offsets',
    seen.length === 7 && seen.every((s, i) => (s.now - zero) === EXPECT[i]),
    JSON.stringify(seen.map((s) => s.id + '@' + (s.now - zero))));
  process.stdout.write('  INFO  observed effect offsets: ' + seen.map((s) => s.id + '@' + (s.now - zero)).join(', ') + '\n');
  process.stdout.write('  INFO  state right after the last segment: ' + boot.state + '\n');
  check('the stage is still mounted while the fade-out runs', hosts(e.doc).length === 1,
    'hosts=' + hosts(e.doc).length + ' state=' + boot.state);
  e.clock.tick(1000);
  eq('host removed after the natural end', hosts(e.doc).length, 0);
  check('first-paint class cleared after the natural end', !paint(e.doc));
  eq('no timer left after the natural end', e.clock.pending, 0);
  eq('document listeners released after the natural end', e.doc.listenerCount('click'), 0);
  check('the show reaches a terminal state',
    ['ended', 'skipped', 'degraded', 'reduced-motion'].indexOf(boot.state) !== -1, 'state=' + boot.state);
  e.clock.tick(5000);
  eq('nothing fires after the end', boot.fired.length, 8);
  eq('nothing re-mounts after the end', hosts(e.doc).length, 0);
}

process.stdout.write('\n----------------------------------------\n');
process.stdout.write('t12 probe checks: ' + checks + ', failures: ' + failures + '\n');
process.stdout.write('NOTE: fake DOM + fake clock: scheduling/state/cleanup only, no browser visuals.\n');
process.stdout.write(failures > 0 ? 'RESULT: FAIL\n' : 'RESULT: PASS\n');
process.exit(failures > 0 ? 1 : 0);

```
