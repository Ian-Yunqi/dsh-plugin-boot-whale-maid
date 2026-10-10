# ART-NOTES — maid-atelier 素材判定依据与舞台布局笔记

> 审计对象（只读）：`C:\Users\wangshui\.dsh\profiles\desktop\node_modules\@smalltailqwq\dsh-client-ui-skin-maid-atelier`
> 产出：`docs/assets.json`（机器可读映射）、本文件（判定依据 + 布局建议）、`docs/ATTRIBUTION.md`（署名链）。
> 本任务为**只读审计**：未向该包目录写入、移动、删除或复制任何文件；工作区内未产生任何该包素材的副本（已用 `Get-ChildItem -Recurse -Include *.webp,*.ico` 核实为空）。

## 0. 判定方法（为什么这些 hash 不是猜的）

每个角色都做了**双侧交叉核验**，缺一不可：

1. **客户端角色映射侧**：`lib/client.js` 中 `const MAID_ATELIER_* = skinAssetUrl("<64位hex>.webp")` 的**字面值**（并逐字符比对 64 位 hex）。
2. **宿主路由白名单侧**：`lib/index.js:53-85` 的 `var manifest_default = [...]` 数组（**31 条**，已核实 31 条且互不重复）。路由处理器 `installSkinAssets` 用 `const allowed = new Set(files)` 做白名单，只有命中白名单且文件名匹配 `^[a-f0-9]{64}\.(png|webp)$` 才返回 200（`lib/index.js:19`）。因此“在 manifest 中”等价于“同源路由真的可 200 提供”。
3. **角色语义侧**：`lib/client.js:2515-2533 createCharacterStage()` 的 `dataset.maidCharacter` 赋值链 + 角色 CSS 规则，确认该 hash 对应“左/右/vision”哪一个语义，而不是靠文件大小或文件排列顺序推断。

交叉校验实测结果（31 条白名单，6/6 命中）：

| 角色 | client.js 行 | 该行字面值命中 | manifest 命中 | manifest 下标 | manifest 行 |
|---|---|---|---|---|---|
| maid-left | 38 | ✅ | ✅ | 4 | lib/index.js:58 |
| maid-right | 39 | ✅ | ✅ | 15 | lib/index.js:69 |
| palace-light | 36 | ✅ | ✅ | 11 | lib/index.js:65 |
| palace-dark | 37 | ✅ | ✅ | 19 | lib/index.js:73 |
| chibi | 18 | ✅ | ✅ | 8 | lib/index.js:62 |
| vision | 56 | ✅ | ✅ | 17 | lib/index.js:71 |

> 说明：任务书给出的 6 个锚点全部复核为**逐字符一致**，未发现偏移。同时提示一个真实陷阱：`manifest_default` 按 hash 字典序排列，**排列顺序与角色无关**；且白名单中同时存在 `2818e...`（maid-left）与 `7c5a5...`（maid-right）等相似前缀，任何截断 hash 比对都可能错配。

## 1. 逐项判定依据（引用原行代码文本）

全站样式表是 `lib/client.js:78` 的单个压缩字符串 `const css$1 = "..."`，下面引用的 CSS 规则均出自该行。

### 1.1 maid-left — `2818e5359596b13c5d64f5b1c5d4a9e0c05be477824779af8af37a0e10016b07.webp`

- 声明（`lib/client.js:38`）：
  ```js
  const MAID_ATELIER_MAID_LEFT = skinAssetUrl("2818e5359596b13c5d64f5b1c5d4a9e0c05be477824779af8af37a0e10016b07.webp");
  ```
- 角色语义（`lib/client.js:2520-2523`）：
  ```js
  const left = document.createElement("img");
  left.dataset.maidCharacter = "left";
  left.alt = "";
  left.src = MAID_ATELIER_MAID_LEFT;
  ```
- 一句话判定：**`left.src = MAID_ATELIER_MAID_LEFT` 直接把该 hash 绑到 `data-maid-character="left"` 节点，故它是左侧主立绘。**
- 布局事实（CSS，同一行）：`body[data-dsh-maid-atelier] [data-maid-character=left]{height:96%;bottom:0;left:clamp(8px,1.5%,24px)}`

### 1.2 maid-right — `7c5a5493e84418bc0435013c8605222718923872c15eb46fdd36158d201c0b1e.webp`

- 声明（`lib/client.js:39`）：
  ```js
  const MAID_ATELIER_MAID_RIGHT = skinAssetUrl("7c5a5493e84418bc0435013c8605222718923872c15eb46fdd36158d201c0b1e.webp");
  ```
- 角色语义（`lib/client.js:2524-2527`）：
  ```js
  const right = document.createElement("img");
  right.dataset.maidCharacter = "right";
  right.alt = "";
  right.src = MAID_ATELIER_MAID_RIGHT;
  ```
- 一句话判定：**`right.src = MAID_ATELIER_MAID_RIGHT` 把该 hash 绑到 `data-maid-character="right"`，故它是右侧主立绘（默认视角下与 left 成对出现）。**
- 布局事实（CSS）：`body[data-dsh-maid-atelier] :is([data-maid-character=right],[data-maid-character=vision]){height:92%;bottom:0;right:clamp(8px,1.5%,24px)}`

### 1.3 vision — `98cf9484ee96018b1ddc6d61f30945ce973158002fe31a2be0790e44c6718515.webp`

- 声明（`lib/client.js:56`，位于 `//#region src/client/vision-art.generated.ts`）：
  ```js
  const MAID_ATELIER_MAID_RIGHT_VISION = skinAssetUrl("98cf9484ee96018b1ddc6d61f30945ce973158002fe31a2be0790e44c6718515.webp");
  ```
- 角色语义（`lib/client.js:2528-2531`）：
  ```js
  const vision = document.createElement("img");
  vision.dataset.maidCharacter = "vision";
  vision.alt = "";
  vision.src = MAID_ATELIER_MAID_RIGHT_VISION;
  ```
- 一句话判定：**`vision.src = MAID_ATELIER_MAID_RIGHT_VISION` 绑到 `data-maid-character="vision"`，它是右侧立绘的 V4 Flash Vision 变体，默认 `opacity:0;visibility:hidden`（仅 `flash-glasses=on` 模式才显现），不是第三个人物。**
- 关键证据：CSS `body[data-dsh-maid-atelier] [data-maid-character=vision]{opacity:0;visibility:hidden}`，且仅在 `html[data-dsh-whale-maid-model-exit=enabled][data-dsh-whale-model=flash][data-dsh-whale-maid-flash-glasses=on] ... [data-maid-character=vision]{opacity:1;visibility:visible}` 时出现。
- 尺寸旁证：vision 内在比例 0.5262 与 maid-right 的 0.5259 几乎相同（1394×2649 vs 1077×2048，同构图更高分辨率），与“同一右侧人物的变体”一致。

### 1.4 chibi — `405917afdb68d725624bbf7e4f1619a35fc4004039b7d553c5528ca5f65308d3.webp`

- 声明（`lib/client.js:18`，位于 `//#region src/client/art.ts`，注释为 *Generated sidebar and ornamental raster assets*）：
  ```js
  const MAID_ATELIER_CHIBI = skinAssetUrl("405917afdb68d725624bbf7e4f1619a35fc4004039b7d553c5528ca5f65308d3.webp");
  ```
- 角色语义（`lib/client.js:2654-2661`）：
  ```js
  const mascot = document.createElement("img");
  mascot.dataset.skinChrome = "sidebar-mascot";
  ...
  mascot.src = MAID_ATELIER_CHIBI;
  ```
- 一句话判定：**该 hash 是侧边栏 `data-skin-chrome="sidebar-mascot"` 吉祥物（Q 版）图，源码中唯一使用点即为 mascot。**
- 布局事实（CSS）：`... [data-skin-chrome=sidebar-mascot]{left:52%;bottom:calc(var(--maid-sidebar-swag-height) + 94px);...width:var(--maid-sidebar-mascot-width);object-fit:contain;object-position:center bottom;...height:auto;max-height:38%;position:absolute;transform:translate(-50%)translateZ(0)}`
  其中 `--maid-sidebar-mascot-width: min(320px, calc(var(--maid-sidebar-width) * 0.82))`、`--maid-sidebar-width: 280px`（`lib/client.js:2873`）；窄 rail 模式 `[data-maid-sidebar-size=rail]` 下 mascot 直接 `display:none`。

### 1.5 palace-light — `52e7dce6993e3f955c3fbb2875885e7ab60fb38ca89adb15d977c7a85d58c073.webp`

- 声明（`lib/client.js:36`，位于 `//#region src/client/background-art.generated.ts`）：
  ```js
  const MAID_ATELIER_PALACE_LIGHT = skinAssetUrl("52e7dce6993e3f955c3fbb2875885e7ab60fb38ca89adb15d977c7a85d58c073.webp");
  ```
- 角色语义（`lib/client.js:2863-2865`）：
  ```js
  const syncBackdrop = () => {
      const next = `url(${body.hasAttribute("data-ds-dark-theme") ? MAID_ATELIER_PALACE_DARK : MAID_ATELIER_PALACE_LIGHT})`;
      if (body.style.getPropertyValue("--maid-palace-art") !== next) body.style.setProperty("--maid-palace-art", next);
  };
  ```
- 一句话判定：**`body` 未带 `data-ds-dark-theme` 时 `--maid-palace-art` 取 `MAID_ATELIER_PALACE_LIGHT`，故它是亮色主题的宫殿背景。**
- 布局事实（CSS）：`body[data-dsh-maid-atelier] [data-skin-chrome=character-stage]{z-index:0;pointer-events:none;contain:strict;background:var(--maid-palace-art) center bottom / cover no-repeat;position:absolute;inset:0;overflow:hidden}`

### 1.6 palace-dark — `ae6917bb1aafa71e6a10cfcaa1289f13e265aa7f32d3fb7c1988004bf50f8983.webp`

- 声明（`lib/client.js:37`）：
  ```js
  const MAID_ATELIER_PALACE_DARK = skinAssetUrl("ae6917bb1aafa71e6a10cfcaa1289f13e265aa7f32d3fb7c1988004bf50f8983.webp");
  ```
- 角色语义：同 1.5 的 `syncBackdrop()`，`body.hasAttribute("data-ds-dark-theme")` 为真时取 `MAID_ATELIER_PALACE_DARK`。
- 一句话判定：**暗色主题（`data-ds-dark-theme`）分支下 `--maid-palace-art` 取该 hash，故它是暗色主题宫殿背景；与亮色版同尺寸（1586×992），是同一构图的两套配色。**
- 暗色主题下立绘另加滤镜：`body[data-dsh-maid-atelier][data-ds-dark-theme] [data-maid-character]{filter:brightness(.84)saturate(.92)drop-shadow(0 22px 28px #0000004d)}`

## 2. 原始像素尺寸（WebP 头部解析，未解码整图）

解析方式：只读前 64 字节，按 RIFF/WEBP 容器遍历第一个图像 chunk——
`VP8 `（lossy）：跳过 3 字节 frame tag 后校验起始码 `9d 01 2a`，再读 2+2 字节 14-bit 宽高；
`VP8L`（lossless）：读 1 字节 signature 后的 32-bit 位域，`w=(b&0x3fff)+1`、`h=((b>>14)&0x3fff)+1`；
`VP8X`（extended）：读第 1 个字节 flags + 跳过 3 字节 reserved 后读 24-bit `canvas width-1`/`height-1`。
全程未调用任何图像库、未用 .NET 解码、未渲染大图。

| 角色 | 尺寸 (w×h) | 内在比例 w/h | WebP chunk | 字节数 | 与源码注释的交叉验证 |
|---|---|---|---|---|---|
| maid-left | 1122 × 2019 | 0.5557 | VP8L | 1 034 470 | 源码注释称 left 占 0.556 宽度比 ✅ |
| maid-right | 1077 × 2048 | 0.5259 | VP8L | 1 209 838 | 源码注释称 right 占 0.526 宽度比 ✅ |
| vision | 1394 × 2649 | 0.5262 | VP8L | 1 863 474 | 与 maid-right 同比例，佐证“同一人物变体” |
| palace-light | 1586 × 992 | 1.5988 | VP8 (lossy) | 279 480 | ≈16:10 横向背景 |
| palace-dark | 1586 × 992 | 1.5988 | VP8 (lossy) | 270 544 | 与亮色版同尺寸 |
| chibi | 620 × 553 | 1.1212 | VP8X，flags `0x10`（alpha 位已置） | 91 476 | 横向 Q 版，容器声明带 alpha |

六项尺寸**全部可靠读出**，故 `docs/assets.json` 中无 `null`。

强证据：`lib/client.js:2296-2299` 的注释独立给出两个比例——“Both maids are sized against the conversation column's HEIGHT — 96% and 92% of the stage … standing side by side they need 0.556 + 0.526 of that height in WIDTH, the maids' intrinsic ratios.”。我实测的 1122/2019 = 0.5557、1077/2048 = 0.5259 与之吻合到小数点后三位，说明**尺寸读法与源码作者的一致**，不是巧合。

未核实项（不编造）：chibi 的 VP8X 只说明容器允许 alpha/元数据，我**未解码像素、未验证实际透明度与 ICC profile**；如需确认透明通道，应在实现侧用浏览器 `naturalWidth/naturalHeight` 与渲染结果复核。

## 3. 基于尺寸的舞台布局建议

### 3.1 主立绘：高度占比与锚点

沿用原皮肤的几何，boot 舞台按**舞台高度 H 的百分比**定立绘高度，`width:auto`，绝不拉伸：

```css
.maid { position: absolute; bottom: 0; width: auto; height: auto; object-fit: contain; object-position: center bottom; }
.maid[data-maid-character="left"]           { height: 96%; left:  clamp(8px, 1.5%, 24px); }
.maid[data-maid-character="right"]          { height: 92%; right: clamp(8px, 1.5%, 24px); }
```

- **锚点**：`bottom: 0` + `object-position: center bottom`。原皮肤立绘是**透明背景的全身立绘、脚底贴底边**，所以必须底对齐；用 `center center` 会把人物悬浮、且顶部装饰（帽饰/发饰）容易被切。
- **绝不用 `background-size: cover` 处理立绘**，也不要设 `width:100%`：0.55 的窄长比例一旦按宽度铺满就会把高度撑到宽度的 1.8 倍，头部出画。
- 建议 boot 动画额外留出**顶部安全区**：96%/92% 已是上限，若动画有从下往上“出场”位移，起始帧给 `translateY(6%~10%)`、结束帧归 0，不要用 `scale` 放大超过 1.0，否则等同拉伸。

### 3.2 双人并排的宽度预算（决定“能不能同时出场”）

两人高度比 × 内在比例，得到**并排所需宽度**（相对 H）：

| 状态 | left 高度 | right/vision 高度 | 宽度和 (× H) |
|---|---|---|---|
| 默认（无对话） | 96% | 92% | 0.96×0.5557 + 0.92×0.5259 = **1.0173 H** |
| 对话激活 | 64% | 62% | **0.6817 H** |
| ≤700px 且对话激活 | 46% | 44% | **0.4870 H** |

判定式：当**可用舞台宽度 < 1.0173 × H + 32px** 时双人会重叠。原皮肤正是用这个判定触发“让一个人滑走”的降级逻辑：`CROWDED_GAP_PX = 32` / `RESTORE_GAP_PX = 96`（`lib/client.js:2323/2325`，含 32→96 的回滞防抖），拥挤时按模型分支只保留一人：
- `html[data-dsh-whale-model=pro] … [data-maid-figures-crowded] :is([data-maid-character=right],[data-maid-character=vision]){opacity:0;translate:100vw}` → pro 保留 **left**；
- `html:not([data-dsh-whale-model=pro]) … [data-maid-figures-crowded] [data-maid-character=left]{opacity:0;translate:-100vw}` → 默认（非 pro）保留 **right**。

→ **boot 动画建议**：默认路径按“保留 maid-right”实现（与皮肤默认分支一致），并沿用 32/96px 回滞，避免窗口拖拽时闪烁。实际预算：1920×1080（H=1080）需宽 ≈1099px，富余；1366×768 需 ≈781px，富余；1280×900 且右侧开 400px 面板时列宽 ≈600px < 948px → 触发双人降级。

### 3.3 Q 版（chibi）体量

- 内在比例 1.1212（620×553），近方形横向。原皮肤用法是**按侧边栏宽度的 82% 且上限 320px、`height:auto`、`max-height:38%`、`object-fit:contain`**。
- 舞台式出场建议：把 chibi 当作**体量参照物**，高度取 **舞台高度的 12%–18%**（宽度自然为 0.135–0.202 H，比主立绘小一个量级，避免抢镜）；`object-fit: contain`，**不裁切、不变形**。
- 定位建议贴在主立绘的**内侧下角**（与主立绘底边同高），横向不越过舞台中线；`prefers-reduced-motion` 下静态呈现。

### 3.4 宫殿背景铺展方式

- 原皮肤：`background: var(--maid-palace-art) center bottom / cover no-repeat`，作用于 `inset:0` 的全舞台层，`z-index:0`、`pointer-events:none`、`contain:strict`。
- 尺寸 1586×992（1.5988 ≈ 16:10）。`cover` + `center bottom` 的含义：**缩放系数取 max(W/1586, H/992)**，底边与水平中心恒对齐，因此地板/台阶线永远落在舞台底部，代价是横向溢出部分被裁。
- 横向（宽高比 > 1.6，如 1920×1080 = 1.78）：按宽度铺满、垂直少量溢出，裁切发生在**顶部**（穹顶/吊灯），人物与地面不受影响 → 可直接沿用 `cover / center bottom`。
- 纵向/窄屏（如 390×844 = 0.46）：`cover` 会按高度放大到 1350×844，**只剩中间约 29% 的竖条**，两侧翼楼被裁掉。此时两种可选策略：
  1. **保持 `cover` + `center bottom`**：画面无留白、无拼缝，代价是失去两侧；背景无人脸、裁切安全，**推荐**。
  2. 改用 `background-size: auto 100%` 并给舞台补一个同色底（`--maid-navy-950:#091333` / `--maid-navy-900:#10204d`，见 `lib/client.js:78`）避免两侧露白。
  **不要用 `contain`**：会出现上下或左右色带，除非同时铺满同色底。
- 主题切换：亮/暗两张同尺寸同构图，boot 期间按 `prefers-color-scheme` 或宿主 `data-ds-dark-theme` 选一张即可，不要交叉淡入两张全屏图（避免同时解码两张 27 万字节级位图造成首帧 jank）；若必须淡入，让亮色层常驻、暗色层叠加过渡。

### 3.5 窄屏优先级取舍

原皮肤的降级梯度（可直接作为 boot 的取舍依据）：≤1080px 立绘透明度降到 0.74；≤700px 且对话激活时高度降为 46%/44%；≤700px 竖屏且无对话时统一 62%；拥挤时只留一人；侧边栏 rail 模式下 chibi 直接隐藏。

boot 出场动画建议优先级：
1. **宫殿背景**（始终保留，`cover`；它是“舞台感”的来源，成本最低）。
2. **右侧主立绘 maid-right**（默认保留位；高度 ≈ min(默认比例, 由宽度反推的上限)）。
3. **左侧立绘 maid-left**（预算不够时第一个让位）。
4. **chibi**（最后加入，窄屏可省）。
5. **vision 可在 boot 中完全不使用**：它默认不可见，仅是 flash 视角变体，用它当“第三个出场人物”会偏离原皮肤语义。

窄屏高度上限：单立绘不能只按百分比设高，否则 0.5259 的比例会在窄视口横向溢出。建议
`height: min(92%, calc(<可用宽度> / 0.5259 * 0.92))` 形式（或等价的 `max-width: calc(100% - 48px)` 兜底——原皮肤在 ≤700px 的 model-exit 分支就用了 `max-width: calc(100% - 48px)`）。以 390×844 竖屏为例：单人 92% 高度 → 高 776px、宽 408px > 390px 溢出；压到 62% → 高 523px、宽 275px 可容纳。**竖屏手机直接单人 + 62%** 是安全默认。

## 4. 同源路由事实与风险（实现侧必须知道）

- 客户端 URL 构造（`lib/client.js:9-11`）：
  ```js
  function skinAssetUrl(file) {
      return new URL(`skin-assets/maid-atelier/${file}`, document.baseURI).href;
  }
  ```
  注意是**相对 `document.baseURI` 的解析**（无前导斜杠），可兼容反向代理挂载路径与 dsh-app 转发；`assets.json` 中统一记为绝对路径形式 `/skin-assets/maid-atelier/<hash>.webp`。boot 插件在自己的 shadow root / 宿主半边里应做同样的相对解析（或直接用 `new URL('skin-assets/maid-atelier/'+file, document.baseURI)`），不要把域名写死。
- 宿主路由注册（`lib/index.js:4-6, 90`）：`const prefix = \`/skin-assets/${id}\``，调用处 `installSkinAssets(ctx, "maid-atelier", new URL("../assets/runtime/", import.meta.url), manifest_default)` → 前缀即 `/skin-assets/maid-atelier`。
- 服务细节：仅 `GET`/`HEAD`（否则 405 + `Allow: GET, HEAD`）；`!allowed.has(file)` 或文件名不匹配 `^[a-f0-9]{64}\.(png|webp)$` → 404；`Content-Type: image/webp`；`Cache-Control: public, max-age=31536000, immutable`；`ETag: "<hash>"`；命中 `If-None-Match` 返回 304；`X-Content-Type-Options: nosniff`。
- ⚠️ **依赖风险（建议实现侧显式处理）**：该路由由 **maid-atelier 皮肤插件的主机半边**注册（`webCtx.effect(...)` 随插件启用而存在）。因此 `/skin-assets/maid-atelier/*` **只有在 maid-atelier 皮肤插件已安装并启用时才返回 200**；未安装/未启用时是 404。boot 插件**不得假设素材一定可达**：应在动画启动前对首帧立绘做一次 `img.decode()` / `onerror` 探测，失败时退化为纯 CSS（渐变 + 文字/几何）出场，保证“150ms 内可跳过”与不阻塞真界面露出。这一条是本审计给出的、需要主控决策的实现约束。

## 5. 只读合规自证

- 审计仅使用 `read`/`grep` 与三次只读 Node 探测（`fs.readSync` 前 64 字节、`fs.statSync`），未打开任何文件用于写入；未对该包目录执行复制/移动/删除。
- 工作区未出现该目录任何素材副本（`.webp`/`.ico` 扫描为空）；`docs/` 内只有文本与 JSON，无位图。
