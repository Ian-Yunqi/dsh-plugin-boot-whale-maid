# VISUAL-REVIEW — 鲸鱼厨娘开屏舞台：版式结论、美术方向核对与截图证据

> **证据状态（主控收尾冻结）**：本文档的**最终有效视觉证据**是 **附录 Y** 的三张真实浏览器截图
> （`screenshots/stage-01-maids-entering-3.0s.png`、`stage-02-title-complete-4.5s.png`、
> `stage-03-stable-stage-5.3s.png`）及其逐帧状态日志 `screenshots/shot-log.json`。
> 正文与附录 Z 中关于截图的**更早尝试**（说明页截图、按 virtual-time-budget 试拍的图、
> 软件光栅化版式图）均为**历史记录 / 版式核对用**，**不得作为视觉验收证据**。
> 截图目录已统一为 `screenshots/`（软件版式图在 `screenshots/layout-maps-software-rasterised/`）。

> 评审对象：`dsh-plugin-boot-whale-maid` 冻结修订（`lib/client.js` 共 1255 行，t15 修复后的提交）
> 评审日期：2026-10-10
> 产出：本文件 + `screenshots/`
> 本任务未改动 `lib/` 与 `scripts/` 下任何文件。
>
> **【追加 · 主控收尾｜附录 Z】** 会话后续在用户放宽文件策略后，**浏览器无头截图已可得**。
> 附录 Z 给出真实 Chromium 渲染的**真实舞台**截图、并回答本文 §3.3 的遗留问题。
> 正文（§0–§9）保持原评审当时的判断与措辞，未作改写。
>
> **注意路径**：本文件早期版本引用 `screenshots/`；打包方随后把目录统一命名为
> `screenshots/`。本文已统一为 `screenshots/`。

---

## 0. 结论摘要（先读这一节）

1. **F9 不成立为缺陷**：1920×1080 下，标题绘制盒右缘 = 1285.49px，右立绘左缘 = 1317.49px，
   **净空 32.00px，不存在重叠**。当前实现用「主立绘真实右缘 + 32px」定位标题
   （`lib/client.js:1126-1152`），并让 `--wm-title-avail` 做二次上限，几何上恒不重叠。
   契约书里描述的 `left:58%; width:min(40vw,620px)` 是**迁移前的旧算式**，它确实会重叠
   416.11px（§2.5），但该算式已不在冻结代码中。因此 **既不需要改坐标，也不需要让右立绘让位**。
2. **浏览器无头截图在 t18 执行时不可得**（沙箱策略拒绝 Chrome/Edge 的 mojo 命名管道，
   原始报错见 §3.2）；**该限制已在会话收尾时解除**，真实截图见 **附录 Z**。
3. **用户提供的新版参考图未在工作区内找到**（§4.1）。因此 §4 只能依据任务书转述的
   **6 条文字方向**核对，不能声称「已按参考图目视核对」。
4. **占位预览与概念参考图都不构成真实立绘效果验收**（§1、§6）。
5. 目录里曾有一批非本任务产物、且未拍到舞台的 PNG，其性质已在 §3.3 说明；
   该遗留问题已由附录 Z 回答。

---

## 1. 三种「画面」必须分清

| | ① 占位预览 | ② 概念参考图 | ③ 真实插件效果 |
|---|---|---|---|
| 是什么 | `scripts/preview.html` 双击 `file://` 播放的**动作/版式**预览；立绘位置是本插件自制内联 SVG 占位框（由 `opts.swap` 提供，见 `lib/client.js:508-510`、`:710`） | 用户提供的**美术方向参照图**；只用于指导构图、灯光与节奏 | 装到 DSH、启用 maid-atelier 皮肤后，`/skin-assets/maid-atelier/<hash>.webp` 真图在 shadow root 里按同一套时间线播出的效果 |
| 能看到 | 幕布开合、时间线分段、落位停顿、标题出现次序、粒子/鲸尾层位置、跳过行为、版式比例 | 理想的成熟冷静气质、灯光氛围、留白关系 | 以上全部 + **真实人物五官/服装/发型的最终观感** |
| 看不到 | **真实五官、服装、发型**（只有几何框） | 本插件任何实际渲染结果 | —— |
| 本文件能证明什么 | 时间线、层次、版式、几何关系 | 不证明任何实现 | 附录 Z 截图能证明**舞台确实渲染并可见**；但真实立绘观感仍须人工判断 |
| 是否已验收 | ❌ 未作为「画面效果」验收 | ❌ 参考图不是交付物 | ⚠️ 舞台可见性已由附录 Z 证实；**真实立绘美术效果仍未验收** |

补充硬边界（业务口径）：

- **参考图不替换原皮肤立绘，也不铺成动画背景。** 本插件的素材请求只有 5 条同源路由
  （`maid-left` / `maid-right` / `palace-light` / `palace-dark` / `chibi`，见 `lib/client.js:45-95`），
  全部来自 maid-atelier 皮肤插件自己注册的路由；插件不复制、不二次分发、不新增位图。
- **用户认可参考图 ≠ 实际动画或真实立绘效果已验收通过。** 本文件不据此宣称任何画面验收结论。
- 附录 Z 的截图里立绘仍是**本插件自制 SVG 占位**（data URI），**不是原皮肤立绘**；
  因此它们能证明「舞台结构与灯光层次成立」，**不能**证明真实立绘观感。

---

## 2. F9 结论：宽屏标题盒与右立绘是否真重叠

### 2.1 冻结代码里的真实算式

`lib/client.js:1126-1152`：

```js
const leftInset = Math.max(8, Math.min(0.06 * stageW, 96));
const leftSpriteRight = leftInset + STAGE_CONFIG.maidLeftHeight * stageH * 0.5557;  // 主立绘真实右缘
const rightInset = Math.max(8, Math.min(0.05 * stageW, 80));
const rightSpriteLeft = stageW - rightInset - STAGE_CONFIG.maidRightHeight * stageH * 0.5259;
const minTitleWidth = 320;
const usableGap = rightSpriteLeft - leftSpriteRight - 2 * STAGE_CONFIG.twoMaidGapPx;
const roomForTitle = stageH > 0 && usableGap >= minTitleWidth;
const showRight = !narrow && roomForTwo && roomForTitle && stageH >= STAGE_CONFIG.rightMaidMinPx;
const titleLeft = narrowTitle ? stageW * 0.52 : (leftSpriteRight + STAGE_CONFIG.twoMaidGapPx);
const titleAvail = Math.max(0, titleRightLimit - titleLeft - STAGE_CONFIG.twoMaidGapPx);
const titleMax = Math.max(200, Math.min(TITLE_MAX_PX, narrowTitle ? 0.9 * TITLE_MAX_PX : titleAvail));
```

CSS 侧（`lib/client.js:351-352`）真正的宽度声明是：

```css
.wm-title-inner{position:absolute;left:var(--wm-title-left,58%);top:47%;
  width:min(40vw,var(--wm-title-max,620px));max-width:var(--wm-title-avail,40vw);transform:translateY(-50%)}
```

`--wm-title-left` / `--wm-title-max` / `--wm-title-avail` 由 JS 按每个视口现算并写在 `.stage`
的 inline style 上（`lib/client.js:472-475`）；`58%` / `620px` 只是 CSS 兜底默认值。

### 2.2 1920×1080 实算（与真实运行交叉核对）

| 量 | 值 |
|---|---|
| 主立绘 | `left:96px`（`clamp(8px,6%,96px)` 取到 96 封顶），宽 `0.96×1080×1122/2019 = 576.17`，右缘 **672.17** |
| 右立绘 | `right:80px`（`clamp(8px,5%,80px)` 取到 80 封顶），宽 `0.92×1080×1077/2048 = 522.51`，左缘 **1317.49** |
| 双人之间净空 | 1317.49 − 672.17 = **645.32** |
| 可用标题空间（扣两侧各 32px） | **581.32** |
| 标题盒 | `left = 672.17 + 32 =` **704.17**，`max = min(620, 581.32, 581.32) =` **581.32** |
| 标题盒右缘 | **1285.49** |
| **结论** | 1285.49 ≤ 1317.49 → **净空 32.00px，不重叠** |

**交叉核对（两条独立路径）**：

- 公式复算：结构版式图生成脚本打印的 `"1920x1080"` 行为 `titleX:704.17`、`titleW:581.32`、
  `titleRight:1285.49`、`rightLeft:1317.49`、`clearance:32`、`oldOverlap:416.11`。
- 真实运行：用假 DOM + 可控假时钟真实跑一次 `createBootShow`（viewport 1920×1080），
  舞台 inline style 实测 `--wm-title-left:704.15px`、`--wm-title-max:581.32px`、
  `--wm-title-avail:581.32px`、`--wm-stage-h:1080px`、`data-right="1"` — 与上表逐项一致
  （704.15 与 704.17 的 0.02px 差来自 `0.06×1920=115.2` 被 `clamp` 上限 96 截断后的浮点路径，
  远小于 1px，不影响结论）。

### 2.3 多视口一览（同一公式，供回归参考）

| 视口 | 右立绘出场 | 标题 left | 标题宽 | 标题右缘 | 与右立绘左缘关系 |
|---|---|---|---|---|---|
| 1920×1080 | 是 | 704.17 | 581.32 | 1285.49 | 净空 32.00 |
| 1600×900 | 是 | 608.14 | 444.43 | 1052.57 | 净空 32.00 |
| 1366×768 | 是 | 523.68 | 370.45 | 894.14 | 净空 32.00 |
| 1440×900 | **否（让位）** | 748.80 | 558.00 | 1306.80 | 右立绘已不出场 |
| 1280×800 | **否（让位）** | 665.60 | 512.00 | 1177.60 | 右立绘已不出场 |
| 390×844 | 否（窄屏） | 202.80 | 155.20 | 358.00 | 窄屏布局，标题落底部 |

规律：只要 `showRight` 为真，标题右缘与右立绘左缘**恒为 32.00px**（两侧各留一个 gap）；
一旦净空不足 320px（`minTitleWidth`），`roomForTitle` 变假 → **右立绘让位**，
标题改用 52% 起点的加宽盒。两条路径都无重叠。

### 2.4 可视化证据

- 结构版式图：`screenshots/layout-maps-software-rasterised/04-f9-geometry-1920x1080.png`（软件光栅化）——
  金色实线框 = 当前标题盒（left 704.17 / width 581.32 / right 1285.49）；右侧白色框 = 右立绘
  （1317.49 → 1840）；中间标尺标注 **CLEARANCE 32PX**；下方暗金色框 = 旧算式
  `58% / min(40vw,620px)` 的位置，注明会重叠 416px。
- **真实浏览器截图：见附录 Z**（`screenshots/stage-0*.png`），可目视确认标题与双立绘的横向关系。

### 2.5 旧算式为什么看起来「重叠」

契约书与 t18 描述里写的 `left:58%` + `width:min(40vw,620px)` 在 1920 宽下是：
`left = 1113.6`、`width = 620`、`right = 1733.6`，而右立绘左缘 = 1317.49
→ **重叠 416.11px**（且会压到右立绘的上部躯干与面部区域）。

这正是 F9 当初被报出来的原因，也是 t15 的修复对象：

- **修复前**：标题起点用「双人并排总宽 `1.0173H`」当锚点，把 645px 的真实空隙误算成 1099px 的偏移。
- **修复后**：改用主立绘真实右缘（`leftInset + 0.96H×1122/2019`），并补 `--wm-title-avail`
  二次上限与 `roomForTitle` 让位开关。

### 2.6 结合参考图的具体建议

参考图方向要求「主立绘占视觉中心、标题在留白区与主立绘平衡、画面必须有留白、
角色与标题不得挤在一起」。按上表：

- **标题移位：不需要。** 当前 32px 净空是「两侧各一个 gap」的对称留白；
  标题中心位于 `704.17 + 581.32/2 = 994.83`，即画面水平 **51.8%** ——
  正好落在双人之间的中偏右留白带，符合参考图的平衡要求。
- **右立绘让位：在 1920×1080 下不需要。** 但在 ≤1440 宽或 ≤768 高的窗口下，
  现有 `roomForTitle`（净空 ≥320px）会**自动**让右立绘退场；这与参考图
  「Q 版与右侧元素明显弱化、主立绘与标题优先」一致，建议保留。
- **若日后想把 32px 净空加大**（更接近参考图的大留白）：改 `twoMaidGapPx`
  （`lib/client.js:112`，当前 32）即可，它同时驱动标题左右留白；
  但注意它也是 `roomForTwo` / `usableGap` 的输入，调大会提前触发右立绘让位。
- **标题盒上限 620px**（`titleMaxPx`）在 1920 下未生效（实取 581.32）：
  标题实际宽度是被间隙约束的，不是被固定值约束的。

> **需人工确认的部分**：以上是几何结论，可离线判定；但「32px 留白在真实立绘下观感是否足够」
> 属于审美判断。**本文件不代用户裁定**，请在真实素材环境按 §7 目视确认。

---

## 3. 截图证据

### 3.1 执行期的结构版式图（4 张）

t18 执行时因浏览器不可用（§3.2），产出 **4 张软件光栅化版式图**。
它们当前位于 `screenshots/layout-maps-software-rasterised/`（打包方二次归档后的位置；
仓库证据副本镜像在 `screenshots/`，见 §8）：

| 文件（`layout-maps-software-rasterised/` 下） | 时间点 | 对应段 | 画面内容 |
|---|---|---|---|
| `01-curtain-rise-0250ms.png` | t = 0.25s | S0 起幕 | 深海蓝径向光 + 深色底幕 + 左右幕布几乎闭合（褶皱条纹可见） |
| `02-maids-landed-title-4000ms.png` | t = 4.00s | S4 标题 | 幕布已退出、宫殿层可见、主立绘+右立绘+Q 版落位、标题盒与副标题出现 |
| `03-lace-tail-5000ms.png` | t = 5.00s | S5 粒子/尾影 | 9 个蕾丝光点沿斜线分布、鲸尾剪影在人物**之后**、标题保持可见 |
| `04-f9-geometry-1920x1080.png` | 静态几何 | F9 | 标题盒 / 右立绘 / 32px 净空 / 旧算式对比 |

它们在图上与页脚都印有 `SOFTWARE-COMPUTED LAYOUT MAP - NOT A BROWSER SCREENSHOT`
与 `PLACEHOLDER SPRITES - NOT THE REAL ARTWORK`，因此不会被误当成浏览器截图。

三张时间点的相位数据不是估的，而是从**真实 `createBootShow` 运行**
（假 DOM + 可控假时钟）读出来的（1280×720 视口）：

| 时间点 | `data-phase` | 段旗标 | `data-curtain` | host `data-state` | 标题变量 |
|---|---|---|---|---|---|
| 251ms | `null`（首段尚未触发；`data-phase="0"` 与 `data-s0` 同时写入） | `data-s0` | `null` | `visible` | left 492.90 / max 342.74 |
| 4001ms | `4` | `data-s4` | `open` | `visible` | left 492.90 / max 342.74 |
| 5001ms | `5` | `data-s5` | `open` | `visible` | left 492.90 / max 342.74 |

同一次运行里，三个阶段都确认存在：`backdrop` / `arch` / `glow` / `palace` / `tail`(含 svg) /
`particles×9` / `maid-left` / `maid-right` / `chibi` / `curtain i×2` / `title-cn span×6` /
`title-en` / `rule`，说明版式图里画的每一层都真实存在于 DOM。

### 3.2 为什么当时不是浏览器截图

t18 执行时，本会话的沙箱**禁止创建浏览器进程**。实测命令与原始报错：

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --no-sandbox --disable-gpu
  --disable-crash-reporter --disable-breakpad --user-data-dir=<temp> --window-size=800,450
  --screenshot=probe.png <url>
→ exit -36863
stderr: [ERROR:crashpad_client_win.cc:430] OpenProcess: 拒绝访问。 (0x5)
        [ERROR:crashpad_client_win.cc:144] crash server failed to launch, self-terminating
        [FATAL:mojo\platform_channel.cc:112] Check failed: . : 拒绝访问。 (0x5)
```

- Chrome 155.0.8059.39 与 Edge 155.0.4283.45 都存在，但都死在 mojo 命名管道创建上。
- 追加 `--no-sandbox`、`--single-process`、`--no-zygote`、`--disable-breakpad`、
  `--disable-crash-reporter` 均无法绕开（这是宿主进程/文件沙箱策略，不是 Chrome 自己的 sandbox 开关）。
- 本会话的沙箱提权当时被禁用，无法从会话内部放宽。

因此按契约「不得伪造截图」的要求，当时改用**确定性、可复现、无浏览器的软件光栅化**
（手写 PNG 编码器 + 自研 2D painter，无第三方库）。

**这些图能证明**：几何、层次、时间点、比例、留白关系。
**不能证明**：浏览器实际渲染、字体度量、阴影/模糊等合成效果、真实立绘观感。
**该限制已在会话收尾时解除 —— 真实截图见附录 Z。**

### 3.3 关于目录里其他 PNG 的说明（已被附录 Z 取代）

执行期截图目录被多个成员并发反复改写：一度出现 `rt-*`、`stage-0*` 等多套命名，
数量在 3～13 之间变化；本任务生成的 4 个文件整批消失过一次，并用生成脚本重新生成。

我曾查看过其中一张 `stage-01-entrance.png`（479,894 B），发现它是**本任务版式图的放缩版本**
（可见幕布褶皱与模糊的 `MAID-LEFT STAND-IN` / `MAID-RIGHT STAND-IN` 字样），并非真实舞台；
另一张显示的是居中「深海女仆工坊」+ 金色细线 + `ABYSSAL MAID ATELIER` 的**降级幕/静态卡片**。

因此本文当时声明：除本任务列出的 4 个文件外，该目录内容不引用、不背书，并留下问题
「无头浏览器里 `preview.html` 的舞台是否真的挂载并可见？」

**该问题已由附录 Z.2 回答：舞台在正常播放期间确实可见**，此前拍不到是**截图时机**与
**探针环境（headless 默认上报 `prefers-reduced-motion: reduce`）** 两个原因，不是产品缺陷。

---

## 4. 参考图逐条核对

### 4.1 前置说明（重要）

**用户提供的新版参考图没有出现在工作区里。** 已做的检索：

- `dsh-plugin-boot-whale-maid/` 递归：只有 `docs/` 下的文本文件（`ART-NOTES.md`、`assets.json`、
  `ATTRIBUTION.md`、`RELEASE.md`、`VERIFICATION.md`、本文件），**无位图**。
- 工作区递归扫描 `*.png / *.jpg / *.jpeg / *.webp / *.gif`（排除 `node_modules`）：
  仅命中 `ref/agent-teams/assets/**`（AgentTeams 组件素材，与本题无关）。
- 近 2 天内新增/修改的文件清单里没有任何图片。
- `%TEMP%`、`Downloads`、`Pictures`、`Desktop` 下未发现候选图。

所以下表的核对依据是**任务书转述的 6 条文字方向**，不是对参考图本身的目视比对。
**这一点必须由人工补做**（把参考图放进工作区或由人眼直接比对），本文件不假装已完成。

### 4.2 六条方向逐条核对

图例：✅ 符合 / ⚠️ 部分符合或需人工确认 / ❌ 不符合。
（证据列的行号均为 `lib/client.js`；真实截图证据见附录 Z.3。）

| # | 方向 | 判定 | 证据 |
|---|---|---|---|
| 1 | 主立绘占视觉中心 | ✅（结构 + 截图） | 主立绘高度 `96%H`（配置 `:102`，规则 `:316-318`），是画面最大单一主体；1920 下左立绘宽 576.17px = 画面 30.0%，右侧 Q 版高度仅 `0.15H`（`:106`、`:334-336`）。附录 Z.3 的 `stage-02` 截图中左立绘承担左侧主要视觉重量。真实立绘下的最终观感仍需人工确认。 |
| 2 | Q 版明显弱化 | ✅ | Q 版高度只有主立绘的 **15.6%**（`0.15H / 0.96H`，`:102` vs `:106`）；基线是 `display:none`（`:341`），只在 `data-narrow="0" && data-chibi="1"` 时 `display:block`（`:343`）；窄屏 `≤720px` 时 `data-narrow="1"`，Q 版永久退场。 |
| 3 | 深海蓝宫殿 + 暖金轮廓光 | ✅（配色与灯光层面） | 调色板 `--wm-navy-deep:#061421`、`--wm-navy:#123248`、`--wm-teal:#3d6c7a`、`--wm-gold:#c8ad73`、`--wm-ivory:#f2ece0`（`:246`）。拱窗暖金竖条 `rgba(200,173,115,.16)→transparent`（`:274-278`）；顶部暖金径向光 `rgba(242,236,224,.16)`（`:279`）；宫殿层压暗 `filter:brightness(.68) saturate(.9)`（`:283`）。**注意**：这是「用 CSS 光照与压暗让真图偏冷」，不是给人物描轮廓光贴图；人物从背景分离靠压暗背景 + 边缘暗角 `rgba(4,10,19,.34→.72)`（`:284-285`）。 |
| 4 | 有纵深与留白 | ✅ | 纵深：拱窗 5 根竖条横向铺在 `4%/22%/40%/58%/76%`、高度 `58/70/50/66/56%`（`:274-278`），宫殿层 `background-size:cover` + `center bottom` 形成近大远小的地面线（`:281-283`）。留白：1920×1080 下双人之间净空 **645.32px**，标题只用 581.32px，两侧各留 32px（§2.2）。附录 Z.3 的 `stage-01` 截图可见拱窗纵深与中部留白。 |
| 5 | 入场平稳减速、落位后停驻、无弹跳摇摆 | ✅ | 缓动只有两条减速曲线、无弹簧：`--wm-ease-out:cubic-bezier(.16,.84,.28,1)`、`--wm-ease-soft:cubic-bezier(.33,.02,.2,1)`（`:247`）。主立绘从 `translate3d(-9%,4%,0)` 单程滑到 `translate3d(0,0,0)`（`:316-322`），**没有回弹或反向关键帧**。落位后的「生命感」只有一次极缓呼吸 `@keyframes wm-breathe{0%:0 0; 50%:-6px; 100%:-2px}`、`9s`、`1 forwards`（`:325`、`:344`）—— 一次性、只在 s3 触发、幅度 6px、终点停住，不是持续漂浮。鲸尾与光点各只跑一次（`:293-294`、`:386`）。 |
| 6 | 标题随后浮现、粒子与尾影作背景陪衬 | ✅ | z 序：宫殿 `1`(`:281`) ＜ 尾影 `2`(`:290`) ＜ 粒子 `4`(`:382`) ＜ 立绘 `5`(`:314`) ＜ 标题 `20`(`:350`) ＜ 幕布 `60`(`:302`)—— 粒子与尾影**在人物之后**，标题在所有装饰之上。时序：标题在 `phase 4`（3.2s）才出现（`:357-380`），晚于主立绘的 `phase 2`（1.8s，`:319-322`）。附录 Z.3 对比 `stage-02`（标题未出现）与 `stage-03`（标题已出现）可见该顺序。 |
| 7 | 收尾统一干净、不留黑屏 | ⚠️ 代码层 ✅ / 截图层未取证 | 整舞台统一渐出 `:host([data-phase="6"]){opacity:0}` + `transition:opacity 800ms`（`:236-245`）；第 8 段走 `finish('end')`（`:892` 起），`fadeHost(800)`（`:926` 起，写 `data-state="fade-out"` + inline `opacity:0` + `transition-duration`），800ms 后才卸载节点（`:914`）。**没有**「底幕先消失再露白」的中间态。但**渐出段的视觉中间帧未拍到**，如实标注（见附录 Z.3 第 5 条）。 |
| 8 | （能力边界）固定立绘无法改五官 | ✅ 已声明 | 见 §5。 |

### 4.3 与参考图可能冲突、建议人工重点确认的点

1. **「暖金轮廓光」的强度**：当前实现是通过压暗背景 + 暖金拱窗/顶光间接分离人物，
   没有在人物边缘叠加勾光。若参考图期待明显的边缘光，需要新增一层
   「立绘副本 + `filter: brightness/contrast` + `mask` 只保留边缘」—— 这属于**新增视觉层**，
   本插件当前未实现，也不在 t18 范围内。
2. **标题字体气质**：中文走系统衬线回退
   （`"Iowan Old Style",…,"Songti SC","Noto Serif CJK SC",serif`，`:249`），
   英文 `letter-spacing:.34em`（`:375`）。若参考图用了特定品牌字，本插件
   **不下载字体、不引外部字体服务**，只能做到「可靠的系统衬线回退」。
3. **留白比例**：32px 净空在小窗口下会显得紧；若参考图是大留白风格，
   建议调 `twoMaidGapPx`（见 §2.6），但要接受右立绘更早让位。

---

## 5. 固定立绘的能力边界（必须如实说明）

### 5.1 代码**不能**做的

- **不能改变人物五官**：眼睛、鼻子、嘴、脸型、表情都是 `maid-left` / `maid-right`
  两张 WebP 的像素。本插件只按同源 URL 引用它们（`lib/client.js:45-95`），
  不做任何重绘、变形或重编码。
- **不能改变服装本体**：服装剪裁、配色、材质、配饰全部由原图决定。
- **不能改变角色设定**：不新增角色、不改发型、不做水平翻转（原图方向被保留）。
- **不能「让立绘动起来」**：没有骨骼、没有分层、没有序列帧；所有动作都只是
  **整张位图**的位移 / 透明度变化。
- **不能凭空生成参考图的气质**：若气质来自人物本身的表情与姿态，代码层面无法复现。

### 5.2 代码**能**做的

| 能做 | 手段 | 代码位置 |
|---|---|---|
| 构图与版式 | 按舞台高度定高、`width:auto` + `object-fit:contain`（不拉伸）、`bottom:0` 底对齐 | `:314-318` |
| 比例与位置 | 左 96%H / 右 92%H / Q 版 15%H（`:102-106`）；双人并排与标题让位由几何判定 | `:1126-1152` |
| 灯光与色彩 | 深海蓝底 + 暖金拱窗 + 顶光（`:246`、`:274-279`）；宫殿层压暗（`:283`）；边缘暗角（`:284-285`） | `:246`、`:274-285` |
| 节奏与时序 | 8 段显式时间线（`:144-154`，各行 `:145-152`）、减速缓动（`:247`）、落位停驻、一次性特效 | `:144-154`、`:247` |
| 遮罩与框景 | CSS/SVG 幕布开合，不可逆终态 `data-curtain="open"` | `:297-312` |
| 前后层次 | z-index 分层让粒子/尾影落在人物之后、标题之前 | `:281`、`:290`、`:382`、`:314`、`:350` |
| 退场 | 整舞台 800ms 统一渐出，不留黑屏 | `:236-245`、`:892-914`、`:926-936` |
| 素材只引用不复制 | 5 条同源路由（`:45-95`）+ `opts.swap` 仅作预览占位（`:508-510`、`:710`） | `:45-95`、`:508-510`、`:710` |

### 5.3 一句话总结

> 代码能编排「怎么让这张立绘登场」，不能编排「这张立绘长什么样」。
> 参考图里的气质若来自人物本身（五官、表情、姿态），**本插件给不了**；
> 若来自灯光、层次、节奏、留白，**本插件已经在做**（见 §4.2 与附录 Z.3）。

---

## 6. 明确未验证项

以下项目**在本文件里没有通过**，不得引用本文件声称它们已验收：

1. **真实立绘美术效果**：附录 Z 的截图用的仍是本插件自制 SVG 占位，**不是原皮肤立绘**；
   真实 maid-atelier 立绘下的最终观感**未验证**。
2. **真实浏览器窄屏（≤720px）版式**：几何是推算，未在真实浏览器里确认过窄屏重排。
3. **字体实际度量**：中文衬线回退的实际字形宽度未知，标题真实换行位置未测
   （宽屏当前是 `white-space:nowrap`）。
4. **参考图目视比对**：参考图不在工作区（§4.1），6 条方向只按文字核对。
5. **安装后开机实测与 550c 实机互斥表现**：未安装到任何 profile。
6. **渐出段的视觉中间帧**：只验证了代码层（统一 800ms 渐出后才卸载），未拍到画面。
7. **真实 404 网络行为**：素材路由不存在时的降级分支只由假 DOM 断言覆盖，未做真实网络验证。

---

## 7. 人工复核步骤（建议）

### 7.1 参考图核对

把参考图放进工作区（例如 `dsh-plugin-boot-whale-maid/docs/ref/`），
人眼逐条比对 §4.2 的 8 条；重点看 §4.3 的三点。

### 7.2 真实浏览器截图

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new ^
  --user-data-dir=%TEMP%\wm-chrome --window-size=1600,900 ^
  --virtual-time-budget=4600 ^
  --screenshot=docs\screenshots\browser-title.png ^
  "file:///<工作区>/dsh-plugin-boot-whale-maid/scripts/preview.html"
```

把 `--virtual-time-budget` 换成 `3200`（起幕）、`4000`（落位）、`4800`（粒子/尾影）
可复现附录 Z 的四张。**坑位提示**（附录 Z.2 实测）：headless Chrome 默认上报
`prefers-reduced-motion: reduce`，若不 stub 该 media query 会走进 reduced 分支（画面近乎全黑）；
且 `--timeout=<ms>` **不会**延迟截图。

### 7.3 真实素材验收

在已启用 maid-atelier 皮肤插件的 DSH 中确认
`http://127.0.0.1:19387/skin-assets/maid-atelier/<hash>.webp` 返回 200，
然后正常启动 DSH，观察开屏动画与真实 DSH 界面的衔接。

### 7.4 F9 结论复核

1920×1080 窗口下查：

```js
document.querySelector('.dsh-whale-maid-boot-host')
  .shadowRoot.querySelector('.stage').style
// 期望 --wm-title-left: 704.15px  --wm-title-max: 581.32px  --wm-title-avail: 581.32px
```

---

## 8. 复现与校验

结构版式图的生成脚本保存在 `screenshots/layout-maps-software-rasterised/gen-shots.mjs`
（无浏览器、无第三方依赖、无网络；内含手写 PNG 编码器、2D painter、5×7 位图字体，
以及与 `lib/client.js` 逐字对齐的几何公式）：

```
node dsh-plugin-boot-whale-maid/screenshots/layout-maps-software-rasterised/gen-shots.mjs
```

> 注意：脚本内的输出目录 `const OUT` 写的是 `screenshots`。它会把图重新写到
> `screenshots/` 根下（而不是 `layout-maps-software-rasterised/` 子目录），
> 若要保持现有归档结构请先改 `OUT`。

**当前磁盘实况**（本文件写作时）：

```
screenshots/                                     # 主归档（package.json 的 files 未包含它）
  layout-maps-software-rasterised/               # 本任务的 4 张软件版式图 + gen-shots.mjs
    01-curtain-rise-0250ms.png 02-maids-landed-title-4000ms.png
    03-lace-tail-5000ms.png 04-f9-geometry-1920x1080.png gen-shots.mjs
  stage-02-maids-landed-2.6s.png                 # 真实浏览器截图（见附录 Z）
  stage-03-title-reveal-3.6s.png
  stage-04-fx-and-tail-4.8s.png
screenshots/                                      # 同一批文件的仓库证据副本（.npmignore 排除）
  layout-maps-software-rasterised/…  stage-02…  stage-03…  stage-04…
```

`.npmignore` 明确把 `screenshots/` 排除出安装包，并注明这些评审截图
「document the build FOR THE REPOSITORY（供仓库/文档引用）」—— 即它们应留在仓库里、
不进 tarball。因此上面两份是**同一内容的两处摆放**，不是重复产出。

契约校验命令：

```
node -e "const fs=require('fs');const d='dsh-plugin-boot-whale-maid/screenshots';if(!fs.existsSync(d))throw new Error('no shots dir');const f=fs.readdirSync(d).filter(x=>x.endsWith('.png'));if(f.length<3)throw new Error('need >=3 png, got '+f.length);console.log('shots OK',f.length)"
```

实测输出 `shots OK 3`（`screenshots/` **顶层**有 3 张真实浏览器截图；
另 4 张软件版式图在 `screenshots/layout-maps-software-rasterised/` 子目录下）。
若把命令改成递归统计，则总数是 7。

---

## 9. 附：本次评审的诚实边界清单

| 事项 | 状态 |
|---|---|
| t18 执行时用 Chrome/Edge 无头截图 | ❌ **被沙箱阻断**（§3.2 原始报错，**未伪造**）；✅ 已在收尾时解除，见附录 Z |
| 结构版式图 | ✅ 4 张，图上**自证为软件版式图**（非浏览器截图） |
| 真实浏览器舞台截图 | ✅ 见附录 Z.3（`screenshots/stage-0*.png`） |
| F9 几何结论 | ✅ 两条独立路径一致，结论「不重叠，净空 32.00px」 |
| 按参考图目视核对 6 条方向 | ⚠️ **参考图缺失**，仅按文字核对 |
| 固定立绘能力边界 | ✅ §5 逐条列明 |
| 占位预览 / 参考图 / 真实效果三者区分 | ✅ §1 |
| 真实立绘美术效果验收 | ❌ **未验收**，需人工 |
| 无头浏览器里舞台是否可见 | ✅ 已答复：可见，见附录 Z.2 |

---

## 附录 Z（历史记录，其截图结论已被附录 Y 取代）｜原标题：（主控收尾）：真实浏览器截图已可得，并回答 §3.3 的遗留问题

> 本节由 captain 追加。本文正文（§0–§9）是 t18 评审当时的判断，**未作改写**。
> 本节只补「当时不可能、现在已做到」的那部分证据，并明确替换关系。

### Z.1 截图能力恢复

t18 在 §3.2 记录的无头浏览器失败（Chrome/Edge 的 mojo 命名管道被沙箱拒绝）**在本次收尾时已解除**：
用户在会话中放宽了文件策略，`chrome --headless=new` 可以正常启动并输出 PNG。
因此 `screenshots/` 现在包含**真实 Chromium 渲染的真实舞台截图**，不再是纯软件光栅化的版式图。

**替换关系（避免混淆）**：上面 §3.1 与 §3.3 描述的那 4 张「SOFTWARE-COMPUTED LAYOUT MAP」PNG
**已被真实截图取代并删除**；目录中现存 PNG 全部为真实浏览器截图。

### Z.2 §3.3 遗留问题的答案：无头浏览器里舞台是可见的

**结论：舞台在正常播放期间确实可见；此前拍不到是「截图时机」与「探针环境」两个原因，不是产品缺陷。**

排查过程（可复现）：

1. 不加 `--virtual-time-budget` 直接拍 `scripts/preview.html`，得到的是页面的**说明文档 UI**；
   工具栏仍停在「第 1 轮播放中」—— 拍摄时动画尚未推进到预期时刻。
2. 给真实 `createBootShow` 注入可步进时钟、冻结在指定毫秒并拍摄诊断页 ——
   **舞台、左/右立绘占位、标题、金色细线、宫殿拱窗、幕布褶皱全部可见**。
3. **关键环境陷阱（探针自身问题）**：headless Chrome **默认上报
   `prefers-reduced-motion: reduce`**，第一版诊断因此走了 reduced 分支
   （`control.state=reduced`），画面近乎全黑。用 `Proxy` 或 stub 该 media query 后，
   正常分支立刻可见。
4. **另一个方法错误**：`--timeout=<ms>` **不会**延迟截图 —— 用自增计数测试页验证过：
   `--timeout=1000` 与 `--timeout=4000` 得到**完全相同的字节**。此前依赖它做的拍摄全部作废。

**关于 host 的 `opacity:0`**：实测正常播放期间 `host` 的 `data-state="visible"`、`:host` opacity 为 `1`。
`opacity:0` 只出现在**第 6 相位（渐出）**与**reduced / degrade 分支**，两者都是设计行为。
因此不存在「播放期间舞台不可见」的产品缺陷，**无需**在截图时强行设置可见性。

### Z.3 有效截图清单（真实 Chromium 渲染真实舞台）

拍摄条件：真实时钟（`--virtual-time-budget`）；真实 `lib/client.js` + 真实 shadow root；
立绘与宫殿使用本插件自制 SVG 占位（data URI，绝无原皮肤位图）；**未对舞台强行设置 opacity 或相关样式**。

| 文件 | 预算 | 画面内容 | 对应时间段 |
|---|---|---|---|
| `screenshots/stage-02-maids-landed-2.6s.png` | 4000 ms | 双立绘落位，标题**尚未**出现 | ≈1.8–3.2s |
| `screenshots/stage-03-title-reveal-3.6s.png` | 4600 ms | 「深海女仆工坊」+ ABYSSAL MAID ATELIER + 暖金细线 | ≈3.2–4.4s |
| `screenshots/stage-04-fx-and-tail-4.8s.png` | 5200 ms | 粒子与鲸尾层出现，位于人物之后 | ≈4.4–5.6s |

（另有一张起幕态截图在会话过程中曾被拍到 —— 见 §3.1 表后的说明与 Z.2 记录的排查过程；
本文件写作时磁盘上只剩上述三张，故只列这三张。）

对用户 6 条美术方向的核对（依据上述截图 + 冻结代码）：

1. **主立绘占视觉中心、Q 版明显弱化** — 符合：左立绘承担左侧主要视觉重量；右立绘贴右缘且明显更窄；
   Q 版高度仅舞台高的 15%（`STAGE_CONFIG`）。
2. **深海蓝宫殿 + 暖金轮廓光、纵深与留白** — 符合：底色 `#061421` / `#123248`；拱窗提供纵深；
   金色仅用于细线与副标题，克制不抢人物；中部留白承载标题。
3. **入场平稳减速、落位后停驻** — 符合：减速曲线 `cubic-bezier(.16,.84,.28,1)`；落位后仅 9s 一次的
   极小幅呼吸（`wm-breathe`），无弹跳、摇摆、持续漂浮。
4. **标题随后浮现，粒子与鲸尾作背景陪衬** — 符合：stage-02 与 stage-03 对比可见标题晚于人物出现；
   粒子层 `z-index:4`、鲸尾层位于人物（`z-index:5`）之后。
5. **整体收尾统一、不留黑屏** — 代码层符合：第 6 相位统一渐出 800 ms 后才卸载（非硬切）；
   但**无视觉中间帧证据**（受虚拟时间与模块加载偏移影响未拍到），如实标注。
6. **标题不压人物** — 符合：见正文 §2 与 Z.4。

### Z.4 与参考图的差异，以及仍未验证的部分

- **人物五官/服装/发型属原立绘本体，代码无法改变**；占位截图里的人形方块不代表真实观感。
- 参考图是厚涂写实光照；本插件是 CSS 径向渐变 + 拱窗遮罩的「舞台灯光」基调。
- **仍未验证**（本文件不声称「已过」）：真实 maid-atelier 立绘下的最终美术效果、真实浏览器窄屏
  （≤720px）版式、安装后开机实测与 550c 实机互斥表现、渐出段视觉中间帧、真实 404 网络行为。

---

## 附录 Y（主控收尾）：真实浏览器定时截图与实测状态日志

> 本节由 captain 追加。它**替换**此前一切「按 virtual-time-budget 猜时刻」的截图尝试，
> 也是唯一一组带**逐帧状态日志**的证据。正文与附录 Z 的既有判断未被改写。

### Y.1 方法与计时基准

此前我反复用 `--virtual-time-budget=<ms>` 试拍并靠文件大小猜时刻，这是错的。改用
**真实浏览器自动化（Chrome DevTools Protocol）** 驱动同一个页面：

1. 页面暴露 `window.__wmCapture`，其时钟由 `performance.now()` 驱动真实计时，
   **动画 t=0 定义为该时钟启用的一刻**，不是页面导航时刻。
2. 驱动端用 `Runtime.evaluate` 等待 `waitUntil(目标毫秒)`，即**等动画自己的时间轴**走到目标时刻，
   再等两个真实帧后读取状态并截图。因此「报告的动画时间」与「实际画面」同源。
3. **未修改透明度、未隐藏角色、未强制显示标题**；幕布与各层的可见性全部由产品自身动画决定。
4. 被测代码为冻结修订 `lib/client.js` sha256 `440E7357692297C8…C315`。

### Y.2 三张有效截图与实测状态

| 文件 | 请求时刻 | 实测动画时刻 | host opacity | 幕布 | 左立绘 | 右立绘 | Q 版 | 中文标题 | 英文副标题 | stage phase |
|---|---|---|---|---|---|---|---|---|---|---|
| `stage-01-maids-entering-3.0s.png` | 3000 ms | **3030 ms** | 1 | open（面板已移出屏外） | 1 | 0.9994 | 1 | **0** | 0 | 3 |
| `stage-02-title-complete-4.5s.png` | 4500 ms | **4529 ms** | 1 | open | 1 | 1 | 1 | **1** | 1 | 5 |
| `stage-03-stable-stage-5.3s.png` | 5300 ms | **5330 ms** | 1 | open | 1 | 1 | 1 | **1** | 1 | 5 |

三张截图的 SHA256（前 16 位）与体积：

- `stage-01-maids-entering-3.0s.png` — 42465 字节 — `7C78BFF5DA15F9F3…`
- `stage-02-title-complete-4.5s.png` — 68753 字节 — `27DB0EE7AC9729E1…`
- `stage-03-stable-stage-5.3s.png` — 76765 字节 — `4248A2DAD0C74525…`

逐帧完整状态日志：`screenshots/shot-log.json`（3985 字节，含 viewport 1600×900、
各段声明时刻、每帧实测状态与当时已触发的段列表）。

### Y.3 按原时间线核对（而不是事后解释画面）

| 时间线要求 | 实测 | 判定 |
|---|---|---|
| 0.5–1.8s 幕布逐步打开 | 3.0s 时 `data-curtain="open"`，面板 transform = `matrix(1, 0, 0, 1, -872.64, 0)`（已移至屏外） | ✅ |
| ≈3.0s 看到角色入场 | 3030 ms：左立绘 1、右立绘 0.9994、Q 版 1，**标题仍为 0** | ✅ |
| 4.4s 后标题完整 | 4529 ms：中文标题 1、英文副标题 1 | ✅ |
| ≈5.0s 完整稳定舞台 | 5330 ms：宫殿 1、三层人物 1、标题 1，`lace-tail` 段已于 4400 ms 触发 | ✅ |

**关键交叉验证**：3.0s 帧与 4.5s 帧在**标题层**上分别是 0 与 1 —— 同一套代码、同一套时钟，
证明「标题晚于人物出现」这条时间线语义**真的生效**，而不是我在事后解释画面。

**关于幕布 opacity 的读法**：日志中 `curtainOpacity` 为 1，但**幕布是两块 54% 宽的面板**，
它们已由 `transform` 整体移出屏外（见上表 matrix 值），因此画面中不遮挡舞台。
只看 opacity 会误判，这一点在此明确记录。

### Y.4 这份证据的边界（必须随截图一起声明）

- **这是测试夹具下的动作预览**：为保证时间基准稳定，抓图页把
  `prefers-reduced-motion` 改为不命中、把 `new Image()` 改为瞬时完成（不消耗 1200 ms 预载预算）。
  **它不能替代正式加载路径，也不能替代真实素材（maid-atelier 立绘）验收。**
- 截图中的人物与宫殿是**本插件自制 SVG 占位块**，**不是真实立绘**，不得作为美术效果宣传。
- 仍未验证：真实立绘下的最终观感、真实浏览器窄屏（≤720px）、安装后开机实测、
  第 6 相位渐出的视觉中间帧、真实 404 网络行为、与用户参考图的目视比对。

### Y.5 关于「预览暂停」的实现说明（诚实版）

交付的 `scripts/preview.html` 提供**重播 / 跳过 / reduced-motion 切换**，但**没有**提供
「在任意时刻暂停并保证画面一致」的功能。本附录的抓图页在**抓图夹具内部**做到了这一点：
它用一个由 `performance.now()` 驱动的真实计时时钟步进时间线，并**等到动画自己的时间轴
到达目标时刻**才截图，因此不存在「JS 暂停而 CSS 过渡仍在跑」的不一致。

我**没有**把该机制伪装成预览页的正式功能，也没有通过改透明度、隐藏角色或强制显示标题来
制造验收画面。
