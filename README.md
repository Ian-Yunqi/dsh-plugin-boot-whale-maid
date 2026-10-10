# dsh-plugin-boot-whale-maid · 鲸鱼厨娘 · 启动舞台

给 DeepSeek Harness 的开机出场动画：启动时全屏「鲸鱼厨娘」舞台式登场，播完整体渐出露出真实界面。

- **单包双面**：宿主半边（`lib/index.js`）在**文档解析期**同步注入一层纯 CSS 底幕，抢在 DSH 自己的原生加载卡（`[data-dsh-boot]`）被绘制之前就把它盖住；客户端半边（`lib/client.js`）随后在**自己的 shadow root** 里挂载舞台并播放 8 段式时间线，播完调用宿主的幂等收尾钩子把底幕交还。
- **可跳过**：画面出现后，**点击任意位置或按 `Esc`** 都在 150 ms 内退场。宿主脚本在首帧阶段就自己监听了 click / Escape（capture 阶段），所以**即使客户端脚本还没加载完也能跳过**。
- **不遮蔽真实界面**：底幕与舞台都是 `pointer-events:none` 的纯展示层，不吞点击、不锁滚动；退场后不留任何节点。
- **零运行期依赖**：两个半边都**不含任何 `import` 语句**，不拉第三方包、不发 `fetch`/XHR、不引用任何本地图片路径。
- **素材只按 URL 引用**：立绘全部走原包注册的同源路由 `/skin-assets/maid-atelier/<hash>.webp`，本包**不复制、不内联、不二次分发**任何素材字节。

---

## 1. 依赖

| 依赖 | 说明 |
|---|---|
| DSH（DeepSeek Harness）桌面端 / Web 端 | 提供 `webserver/index-inject` 注入点与 `dsh.client` 客户端加载能力 |
| Node.js `^22.19.0 \|\| >=24` | `engines` 声明，仅用于本包的离线自检脚本 |
| `@deepseek-ai/cordis`、`react` | `peerDependencies`，**均为 optional**：由宿主提供，本包不 import、不打包 |
| maid-atelier 皮肤插件（可选） | `/skin-assets/maid-atelier/*` 素材路由的提供方。**未安装/未启用时素材 404，动画自动降级为纯 CSS/SVG 幕——这是预期分支，不是错误** |

> 关于 `dsh.client.inject`：本插件不共享任何客户端服务（两个半边零 import），因此该字段**如实为空数组 `[]`**，`peerDependencies` 也**不再**为任何客户端 UI 包声明条目。

---

## 2. 安装与卸载

> 以下命令仅供你自行执行。**本包交付物只落在工作区，不会自行安装进任何 profile。**

### 安装

```bash
# 从 npm / 插件市场（启用后需重启客户端）
dsh plugin --profile desktop add dsh-plugin-boot-whale-maid

# 或从本地目录（当前工作区路径，按你的实际路径替换）
dsh plugin --profile desktop add ./dsh-plugin-boot-whale-maid
```

也可以在 DSH 的 **设置 → 插件** 界面里安装。安装完成后需要**完全重启**客户端（见 §6 人工验收）。

### 卸载 / 回滚

```bash
dsh plugin --profile desktop remove dsh-plugin-boot-whale-maid
```

手工回滚（等价做法）：从该 profile 的组合层中**删除本插件那一行**（`cordis.patch.yml` 里 `name: dsh-plugin-boot-whale-maid` 的 `insert` 条目），随后完全重启。因为本插件只在组合层里多挂一行、不改写任何宿主状态、不写入 profile 目录，删掉该行即彻底回滚，不会留下残留。

---

## 3. 署名链与许可（务必阅读）

本项目**同时**涉及两套互不相同的许可，请分开理解：

### 3.1 美术素材 —— CC BY-NC-SA 4.0

动画所显示的立绘版权属于**上游作者**，不是本包。它们以 **CC BY-NC-SA 4.0**（署名—非商业性使用—相同方式共享 4.0 国际）授权，完整三创署名链为：

**上善（一创：鲸鱼娘角色形象原作者） → ZipZipPipe（二创：加入 DeepSeek 元素的女仆鲸鱼娘再设计） → Small-tailqwq（三创：本皮肤实际使用素材的 DeepSeek 元素再设计）**

- 上善：<https://www.pixiv.net/users/62155430>
- ZipZipPipe：<https://www.pixiv.net/users/18604994>
- Small-tailqwq：三创（dsh-external/dsh-deep-whale）

**完整**的署名文本、原包 `NOTICE` / `LICENSE-ARTWORK` 逐字转录、三个要素（BY / NC / SA）的逐条落地约束、以及本插件对素材的处理边界，全部写在 **[docs/ATTRIBUTION.md](docs/ATTRIBUTION.md)**，以该文件为准。

关键点：

- **仅以 URL 引用**：素材由原包注册的同源路由 `/skin-assets/maid-atelier/<hash>.webp` 在运行时提供，本包不复制、不内联 base64、不做本地副本、不重新托管。
- **「只用 URL」不等于免除许可义务**：仅通过 URL 引用**不构成**许可豁免，也**不自动满足或免除** CC BY-NC-SA 4.0 的任何义务。署名、非商业、相同方式共享三项约束**仍然完整适用**于本插件对素材的使用与展示。提供指向上游资源的 URI/超链接只是**履行**署名义务的一种方式，绝不是**免除**义务的理由。任何再分发素材或由其产生演绎物的行为，都必须重新满足全部要素。
- **非商业（NC）**：不得用于主要指向商业优势或金钱报酬的用途。
- **相同方式共享（SA）**：若再分发素材或素材的演绎物（内联、改色、重绘、打包离线副本等），该部分须以 CC BY-NC-SA 4.0 或兼容许可授权，并附许可文本或链接。
- 本插件**未修改素材**（只做等比 `cover` / `contain` 适配与定位，不裁切人物、不拉伸、不调色），因此本插件是素材的**使用者**，不是其许可方，不对素材主张版权，也不得再许可他人使用素材。
- 该素材路由仅在 maid-atelier 皮肤插件已安装并启用时存在；缺失时返回 404 并触发降级。这属于运行时依赖，**不改变**上述任何义务。

### 3.2 插件自身代码 —— MIT

本包的**代码**（`lib/`、`scripts/`、配置与文档）按 **MIT** 授权，全文见包根 **[LICENSE](LICENSE)**。这是分层声明，`package.json` 的 `license` 字段用 **SPDX 表达式 `"MIT AND CC-BY-NC-SA-4.0"`** 如实表达这层关系（`AND` 表示分发包内**两类内容各自适用其许可**，不是对同一份内容叠加要求）；而**代码**与**素材**的具体授权分别在 `LICENSE` 与 `docs/ATTRIBUTION.md` 里各自说明——代码许可**不会**、也**不能**覆盖素材许可。若你的用途涉及商业场景或大规模再分发素材，请自行向上述权利人取得授权。

| 位置 | 内容 | 覆盖对象 |
|---|---|---|
| `package.json` `license` | `MIT AND CC-BY-NC-SA-4.0` | 分发包整体（代码 + 素材各自适用） |
| `LICENSE` §1 | MIT 全文 | 代码：`lib/`、`scripts/`、配置与文档 |
| `LICENSE` §2 + `docs/ATTRIBUTION.md` | CC BY-NC-SA 4.0 | 美术素材（版权属上游作者） |

---

## 4. 可复现的离线验收

在本包根目录下依次运行（无需启动 Harness、无需浏览器、无需网络）：

```bash
node --check lib/index.js      # 宿主半边语法
node --check lib/client.js     # 客户端半边语法
node scripts/smoke.mjs         # 离线契约自检（清单字段 + 值 + apply() 注册行为）
node scripts/assert.mjs        # 假 DOM 行为断言（时间线、跳过预算、降级、550c 让步、零残留）
```

或一次跑完：

```bash
npm run verify
```

两个脚本的分工与退出码约定：

| 脚本 | 覆盖范围 | 退出码 |
|---|---|---|
| `scripts/smoke.mjs` | **契约**：`type`/`main`/`exports`/`dsh.bundle.patch`/`dsh.client`/optional peers/`files` 白名单落盘；素材 hash 与尺寸逐字段比对 `docs/assets.json`；时间线与舞台几何的实际取值；两半边 `apply()` 在桩上下文上的注册行为 | 全过 `0`，任一失败 `1` |
| `scripts/assert.mjs` | **行为**：手写最小假 DOM + 可控假时钟，覆盖 8 段时间线、点击/Esc 跳过、素材 404 与超时降级、reduced-motion、异常不外抛、重复初始化、中途 dispose、550c 早到与晚到让步、零残留等 | 全过 `0`，任一失败 `1` |

两个脚本都**逐项打印 `PASS` / `FAIL`**，任何一项失败都会以退出码 1 结束，便于接进 CI。

### 4.1 独立动作预览：`scripts/preview.html`

它有两种模式，**请注意区分**：

**模式 1 · 独立动作预览（默认）**：直接双击 `scripts/preview.html`（`file://`）即自动播放，用**本包自制 SVG 占位图形**走完整时间线，可重播、跳过、切换 reduced-motion 分支。此模式**不发任何图片请求**，占位图以 `data:` URI 内联，因此**绝不会**复制或重新托管原包素材。若浏览器策略拦住了 `file://` 读取同目录脚本，可用任意本地静态服务器打开本页——但静态服务器只提供本页与 `lib/client.js`，**它不会**让 `/skin-assets/maid-atelier/` 存在。

> ⚠️ **动作预览，非真实立绘效果。** 该模式里的人物是自制占位图形，只用于检验**节奏、位移、层级、渐出与跳过**，**不代表真实素材下的最终美术效果**。

**模式 2 · 真实素材验收**：只有在**真正提供该素材路由的同源环境**里才有意义，例如已安装并启用 maid-atelier 皮肤插件的 DSH。可先验证路由：

```js
// 该路由存在时应返回图片；返回 404 说明皮肤未启用
fetch('/skin-assets/maid-atelier/<hash>.webp').then(r => console.log(r.status))
```

> ⚠️ **普通静态服务器 ≠ 素材路由已存在。** 静态服务器不会注册 `/skin-assets/maid-atelier/`。当该路由 404 时动画进入 ≤1 s 的降级幕——这是**预期分支**，不是错误。

---

## 5. 跳过、降级与 550c 互斥让步

### 跳过

- 画面出现后**点击任意位置**或按 **`Esc`**（兼容旧式 `keyCode 27`）即退场，**150 ms 内**到达结束态。
- 首帧阶段（客户端脚本尚未加载）由**宿主脚本自己**在 capture 阶段监听并退场；客户端加载后由客户端接管同一套逻辑，最终都汇聚到宿主**唯一的幂等收尾函数** `window.__dshWhaleMaidBoot.end()`，因此重复触发不会出错。
- 底幕与舞台都是 `pointer-events:none`：跳过不依赖「挡住点击」，也不会吞掉本该属于主界面的交互。

### 降级（素材不可用时）

- `/skin-assets/maid-atelier/*` 由 maid-atelier 皮肤插件注册；**皮肤未安装/未启用时一律 404**。
- 客户端对 5 张在用立绘做加载探测（`load` / `error`），并有 **1200 ms 预加载预算**：任何一张 404、失败或超时，统一进入 **≤900 ms 的无位移文字/SVG 降级幕**——**不空白、不阻塞跳过**。
- 系统开启「减少动态效果」时**不预加载**，直接走 320 ms 无位移幕。
- 无论走哪条分支，**8000 ms 无条件兜底**保证底幕一定会被清理，且不依赖客户端是否加载成功。

### 与 dsh-550c-boot 的互斥让步（**双向**）

两者都要抢「开机第一帧」，因此约定**只有一个能上场**：

- **550c 先到**：注入脚本一开头就检查 `documentElement` 上是否已有 `dsh550c-first`，或是否已存在 `window.__dsh550cBoot`。命中则**立即 return**——不加自己的 class、不装钩子、不设监听、不设定时器。客户端半边同样检查，此时**只挂载不播放、立即让步**。
- **550c 后到**：本插件短轮询检测到上述任一标记后，**立即调用自己的 `end()` 让位**，并保留 550c 的 class 不动。
- **只清理自有状态**：本插件只移除自己的 class、监听与定时器，**绝不调用或修改 550c 的私有行为**。

---

## 6. 人工验收（安装后）

### 第 0 步 · 安装

见 §2。**以下步骤需要你自行执行**，本包不会代劳。

### 第 1 步 · 完全重启客户端

**完全退出** DSH 客户端进程后重新启动（不是关窗口、不是刷新页面）。`dsh.client` 的加载发生在启动期，单纯的页面刷新不足以让注入生效。

### 第 2 步 · 必要时硬刷新

若刚更新过本插件，重启后仍看到旧行为，按 **`Ctrl+Shift+R`**（macOS 为 `Cmd+Shift+R`）强制刷新，绕过缓存后再看一次。

### 第 3 步 · 在正确的时机打开控制台

打开开发者工具（`Ctrl+Shift+I`）并切到 **Console**。检查的**准确时机**是：

- **播放期间**：在动画**还在播**（约前 6.5 s）时粘贴下面的片段。窗口很短，来不及的话先按 `Esc` 跳过，把时序观察留到第 5 步。
- **结束/跳过后**：动画正常播完，或你按了 `Esc` / 点击跳过之后，随时可粘贴下面的片段。

### 播放期间应满足

```js
// 1) 舞台宿主存在
document.querySelector('.dsh-whale-maid-boot-host')            // => <div class="dsh-whale-maid-boot-host" …>

// 2) 其 shadowRoot 内的 stage 存在
document.querySelector('.dsh-whale-maid-boot-host').shadowRoot
        .querySelector('.stage')                               // => <div class="stage" data-mode="normal" …>

// 3) 首帧状态正确：documentElement 上本插件的首帧 class 处于「已加上」的初态
document.documentElement.classList.contains('dsh-whale-maid-first')   // => true
document.querySelector('[data-dsh-boot]')                      // => null（原生加载卡没有闪现出来）
```

逐项说明：

- **`document.querySelector('.dsh-whale-maid-boot-host')` 存在**：说明客户端半边已把自己的舞台宿主挂进主文档。
- **`shadowRoot` 内 `stage` 存在**（`.stage`）：说明舞台内容挂在**本插件自己的 shadow root** 里，没有污染主文档。可通过宿主上的 `data-state`（`hidden` → `visible` → `fade-out`）与 stage 上的 `data-mode` / `data-s0`…`data-s7` 观察当前段位。
- **`documentElement` 首帧 class 初末状态**：`dsh-whale-maid-first` 在播放期间为 **`true`**（**初态**），在正常结束或跳过后为 **`false`**（**末态**）。
- **未闪现原生加载卡**：`[data-dsh-boot]` 应为 `null`，或即使存在也**从未在视觉上出现过**——首帧底幕应当从第一帧就盖住它。

### 正常结束或跳过后应满足

```js
// 1) 舞台宿主与首帧节点均已清除
document.querySelector('.dsh-whale-maid-boot-host')                   // => null
document.querySelector('[data-dsh-boot]')                             // => null

// 2) 末态：本插件的首帧 class 已撤销
document.documentElement.classList.contains('dsh-whale-maid-first')   // => false

// 3) 主界面可点击、可滚动、可接收键盘输入
document.body.style.overflow                                          // => ''（未被锁住）
window.scrollY, document.documentElement.scrollHeight                 // => 可滚动（值随滚动变化）
getComputedStyle(document.body).pointerEvents                         // => 'auto'
```

再手工确认：

- **可点击**：点侧边栏/会话列表等控件，正常响应。
- **可滚动**：滚轮或拖动滚动条，页面正常滚动（本插件在挂载期间会临时锁 `body` 滚动，退场后必须**原样恢复**）。
- **可接收键盘输入**：点击输入框后能正常打字；按 `Esc` 不会再有「跳过」副作用（监听已摘除）。

---

## 7. 视觉检查清单

- [ ] **主立绘是第一视觉焦点**：视线第一落点是左侧主立绘，不是标题或背景。
- [ ] **Q 版不抢注意**：右下 Q 版体量克制，不与主立绘争夺注意力。
- [ ] **人物脸部清楚**：没有被裁切、没有被标题或前景元素压住。
- [ ] **标题不压人物**：中文标题逐字浮现时，不遮挡人物面部与关键轮廓。
- [ ] **背景有纵深**：宫殿前景/中景/远景层次可辨。
- [ ] **暗部仍可识别宫殿结构**：最暗处不是一团死黑，仍能看出拱窗、柱式等结构。
- [ ] **动作从容**：只有减速曲线，**无回弹、无弹簧抖动、无过度漂浮**。
- [ ] **金色与粒子克制**：暖金扫光与蕾丝光点**无高频闪烁**，不刺眼、不喧宾夺主。
- [ ] **宽屏 / 普通窗口 / 窄屏**：三种宽度下均**无意外裁切或元素重叠**（窄屏按 720 px 断点重排：标题落到底部、Q 版与粒子隐藏）。
- [ ] **渐出后无残留**：舞台渐出后**没有残留黑屏、色块或遮罩**，直接是真实界面。

---

## 8. 未验证项（诚实声明）

以下内容**尚未**验证，请勿把本包的离线自检结果当作它们的证明：

1. **真实素材下的最终美术效果**：`scripts/preview.html` 用的是自制 SVG 占位图形，`scripts/assert.mjs` 用的是手写假 DOM。**真实立绘的构图、配色、面部清晰度与整体观感没有经过人工目视确认。**
2. **真实浏览器中的布局与窄屏适配**：断点、降级判定（双人并排宽度 ≈ 1.0173 × 舞台高 + 32 px 回滞）与重排逻辑只在假 DOM 上按几何数值验证过，**没有在真实渲染引擎里做过跨宽度的目视验证**，也没有做过真机 DPI / 缩放的验证。
3. **安装后的开机实测**：本包**从未安装进任何 profile**，因此「装好后真正开机能是什么样」——包括注入时序、与宿主其它插件的相互影响、与 550c 的实机互斥表现——**均未在真实启动流程中实测**。§6 的人工验收步骤正是为此准备的。
4. **素材路由的实际可用性**：`/skin-assets/maid-atelier/*` 是否存在取决于 maid-atelier 皮肤插件的安装与启用状态；本包**未在启用该皮肤的实机环境里验证过 200/404 与缓存头**。404 降级路径已由假 DOM 断言覆盖，但真实网络时序未测。

---

## 9. 交付记录与契约修正（不追溯改写已完成任务）

本节只**追加**记录变更事实，不改写、不覆盖任何已完成任务的历史结论。

### 9.1 许可一致性修正（本包唯一一次许可口径变更）

**修正前的问题**：`package.json` 的 `license` 字段是 `"CC-BY-NC-SA-4.0"`，把**整个分发包**标成素材许可的单一取值，与 `LICENSE` §1「代码按 MIT 授权」的分层**直接矛盾**；`README` §3.2 当时也随之声称「`license` 字段描述整个分发包的总体面貌」，属于同一错误的复述。

**修正后**：三处口径统一为「代码 MIT、素材 CC BY-NC-SA 4.0，两类内容各自适用」：

- `package.json`：`"license": "MIT AND CC-BY-NC-SA-4.0"`（SPDX 表达式；`AND` 表达分发包内两类内容各自适用其许可）
- `LICENSE`：**实质内容未改**——§1 代码 MIT 全文、§2 素材 CC BY-NC-SA 4.0 与完整三创链，维持原样
- `README` §3.2：改为如实说明 SPDX 表达式的含义，并新增上方的三行归属对照表

**特别说明（避免误记）**：本次修正的理由是**分层不一致**，**不是**「`CC-BY-NC-SA-4.0` 不是有效 SPDX 标识符」。该标识符**有效**，此前的相反判断已撤回；素材许可部分在任何检查里都必须保持 `CC-BY-NC-SA-4.0` 不变。

**固化**：`scripts/smoke.mjs` 新增第 8 组一致性断言（原文断言未重写，仅在 `// --- 7)` 之后追加一组），读取 `package.json` 的 `license`、`LICENSE` 文本与 `README` 许可段，断言三者互不冲突；任何一处再漂移都会让 `node scripts/smoke.mjs` 以退出码 1 失败。

| 文件 | 本次改动 | 说明 |
|---|---|---|
| `package.json` | `license` 字段 | `CC-BY-NC-SA-4.0` → `MIT AND CC-BY-NC-SA-4.0` |
| `README.md` | §3.2 正文 + 归属对照表 + 新增本节 §9 | 修正陈旧表述，追加交付记录 |
| `scripts/smoke.mjs` | 追加第 8 组一致性断言 | 未重写原有断言 |
| `LICENSE` | **无实质改动** | 仅复核确认分层正确 |

### 9.2 跨任务文件范围说明（供核验时对照）

以下改动发生在更早的任务里，因当时的契约 `inScope` 未包含对应文件而**无法登记在那些任务的 `changedPaths`** 中，此处据实登记，不追溯修改历史任务结论：

| 文件 | 改动 | 来源 |
|---|---|---|
| `package.json` | `dsh.client.inject` 改为 `[]`；`peerDependencies` / `peerDependenciesMeta` 移除未使用的 `@deepseek-ai/dsh-client-ui-slots`；`files` 加入 `scripts`、移除不存在的根级 `preview.html`；`scripts.selfcheck`（指向不存在的 `scripts/selfcheck.mjs`）改为真实的 `smoke` / `assert` / `verify` | 由「离线契约自检 + README」任务的正文明确指示 |
| `LICENSE` | 新建（此前 `files` 白名单列了它但盘上不存在） | 同上，正文第 2 条指示 |
| 包根 `.verify/` | 删除（`host-behaviour.mjs`、`host-contract.mjs`、`manifest.cjs` 三个临时自检脚本） | 同上，正文第 3 条指示 |

> 说明：`docs/VERIFICATION.md` 在本包中**不存在**，因此 `README` 未引用它，以免指向不存在的文件。若后续补入该文件，请在此表登记。

### 9.3 自检覆盖范围

| 脚本 | 覆盖 | 退出码 |
|---|---|---|
| `scripts/smoke.mjs` | 契约与一致性：清单字段、素材表值与 `docs/assets.json` 逐字段比对、时间线与几何取值、`apply()` 注册行为、**许可三处一致性** | 全过 0，任一失败 1 |
| `scripts/assert.mjs` | 行为：假 DOM + 假时钟下的时间线、跳过、降级、让步与零残留 | 全过 0，任一失败 1 |
