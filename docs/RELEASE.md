# RELEASE — 打包记录与解包复核

> **结论先行：本包当前不可发布。** `.tgz` 已生成并通过了「入口/必要文件齐全、无冗余、无素材字节、无 node_modules」的核对，但**解包后的重跑验收未全部通过**：`scripts/assert.mjs` 退出码为 1（`RESULT: FAIL`），且包内有 3 处私人路径泄漏（其中 2 处是绝对路径）。
> 详见 §5 阻塞项。下面每一项都可按给定命令复现。

- 记录时间：2026-10-10 22:29（本地）
- 打包目录：`dsh-plugin-boot-whale-maid/`
- 包名 / 版本：`dsh-plugin-boot-whale-maid` @ `0.1.0`

---

## 1. 打包命令

本会话里 npm 的**默认缓存目录不可写**，必须显式指定工作区内的缓存目录：

```bash
cd dsh-plugin-boot-whale-maid
npm pack --cache .npm-cache
```

实测对照：

| 命令 | 结果 |
|---|---|
| `npm pack --dry-run` | **失败**，`exit=-4048`：`npm error Log files were not written due to an error writing to the directory: C:\Users\wangshui\AppData\Local\npm-cache\_logs`（`The operation was rejected by your operating system.`） |
| `npm pack --dry-run --cache .npm-cache` | **成功**，`exit=0`，13 files |
| `npm pack --cache .npm-cache` | **成功**，`exit=0` |

`.npm-cache/` 与 `.packcheck/` 均已加入 `.gitignore`，且**不在** `package.json` 的 `files` 白名单内，因此**不会**进入 `.tgz`（已实测：`dist/` 内只有 `.tgz` 一个文件）。

## 2. 构建产物

| 项目 | 值 |
|---|---|
| 绝对路径 | `C:\Users\wangshui\Documents\deepseek-harness\default-workspace\dsh-plugin-boot-whale-maid\dist\dsh-plugin-boot-whale-maid-0.1.0.tgz` |
| 文件大小 | **101 941 字节**（约 99.6 KiB） |
| SHA256 | `5802d6cd01f5311bf107651bd51784ecedaf9e3fa8b34d3ffee999c7ad0539eb` |
| npm shasum | `a965eabdaf1a694177eeb85f6d32b16bba07d954`（打包时 npm 自报） |
| 打包时解包后大小 | 320.7 kB |

校验命令：

```bash
node -e "const fs=require('fs');const d='dsh-plugin-boot-whale-maid/dist';const f=fs.readdirSync(d).filter(x=>x.endsWith('.tgz'));if(!f.length)throw new Error('no tgz');console.log('tgz',f.join(','),fs.statSync(d+'/'+f[0]).size)"
certutil -hashfile dsh-plugin-boot-whale-maid\dist\dsh-plugin-boot-whale-maid-0.1.0.tgz SHA256
```

> **重要：该 `.tgz` 的快照与当前源码已不一致。** 其内含的 `scripts/assert.mjs` 为 **89 264 字节 / sha256 `25ae2db0a3e54681dbbcced9d8a7ab60b1fdf8824aca4cd503755064c4549c3c`**，而该文件在我打包后**仍被持续修改**（观测窗口内 89 036 → 89 087 → 89 264 → 89 988 字节）。它正在被其他成员修复中，属于**变动中的文件**；上表 SHA256 只对应上述快照，重新打包会得到不同的哈希。

## 3. 解包清单（`tar -xzf` 后，`package/` 前缀已省略）

共 **13** 个文件，与 `package.json` 的 `files` 白名单（`lib`、`cordis.patch.yml`、`scripts`、`docs`、`README.md`、`LICENSE`）逐条对照：

| 文件 | 大小 | 白名单条目 |
|---|---|---|
| `lib/index.js` | 12 691 B | `lib` |
| `lib/client.js` | 59 065 B | `lib` |
| `cordis.patch.yml` | 1 939 B | `cordis.patch.yml` |
| `scripts/smoke.mjs` | 22 581 B | `scripts` |
| `scripts/assert.mjs` | 89 264 B | `scripts` |
| `scripts/preview.html` | 17 444 B | `scripts` |
| `docs/assets.json` | 3 265 B | `docs` |
| `docs/ART-NOTES.md` | 19 111 B | `docs` |
| `docs/ATTRIBUTION.md` | 11 511 B | `docs` |
| `docs/VERIFICATION.md` | 55 501 B | `docs` |
| `package.json` | 1 613 B | （npm 强制包含，非白名单条目） |
| `README.md` | 21 201 B | `README.md` |
| `LICENSE` | 5 516 B | `LICENSE` |

- **无多余文件**：除 `package.json`（npm 保证包含的清单文件）之外，没有任何白名单之外的内容。
- 所有必需文件**存在且非空**：`lib/index.js`、`lib/client.js`、`cordis.patch.yml`、`scripts/smoke.mjs`、`scripts/assert.mjs`、`scripts/preview.html`、`docs/assets.json`、`docs/ART-NOTES.md`、`docs/ATTRIBUTION.md`、`README.md`、`LICENSE` 全部为 0 字节以上。
- `docs/VERIFICATION.md` 在本次打包时**已存在**（由样例审计任务产出），因此已随之入包；`docs/VISUAL-REVIEW.md` 与 `docs/shots/` 在打包时点**尚不存在**，故不在包内。此为打包时点的真实状态，未为凑清单而等待或伪造。

### 3.1 禁止内容核对（全部通过）

| 检查 | 结果 |
|---|---|
| `node_modules` | **不存在** |
| `.npm-cache` / `.packcheck` / `.git` | **均不存在** |
| 原皮肤图片字节（`.webp/.png/.jpg/.jpeg/.ico/.gif/.bmp`） | **0 个** |
| 临时探针文件（`probe*`、`isolate*`、`asar-*`、`temp-*`、`*.orig/*.bak/*.rej`） | **0 个** |

> 素材说明：动画只在运行时按同源 URL 引用 `/skin-assets/maid-atelier/<hash>.webp`，包内**不含任何位图字节**，与 `LICENSE` §2 和 `docs/ATTRIBUTION.md` 的声明一致，已由本条机械核对。

## 4. 解包后的重跑验收（**未全部通过**）

在**解包目录内**执行（证明发布物自身自洽，不依赖工作区其它文件）：

| # | 命令 | 退出码 | 输出 |
|---|---|---|---|
| 1 | `node --check lib/index.js` | **0** | 无输出 |
| 2 | `node --check lib/client.js` | **0** | 无输出 |
| 3 | `node scripts/smoke.mjs` | **0** | `74/74 checks passed` |
| 4 | `node scripts/assert.mjs` | **1** | `checks: 386, failures: 7` → `RESULT: FAIL` |

1–3 通过；**第 4 条不通过**，因此「四条全部退出码 0」的验收条件**未满足**。

## 5. 阻塞项（本次未能验收的原因）

### 5.1 `scripts/assert.mjs` 自身失败（**高**，阻塞发布）

- 现象：解包后运行退出码 1，`RESULT: FAIL`。快照内为 `checks: 386, failures: 7`；同一时刻工作区源码为 `checks: 401, failures: 23`。该文件在我核查期间**持续被修改**（观测到 89 036 → 89 087 → 89 264 → 89 988 字节），**属于变动中的文件**，我无法在它稳定前给出可信结论。
- 已确认**不是打包损坏**：源码与解包件在打包时 sha256 一致（打包前后 `assert.mjs` 哈希相同，`stable: True`）；失败同样能在**工作区源码**上复现。
- 失败样例（截至 22:29 工作区源码，共 23 条）：
  - `before its segment the main sprite is still hidden :: expected 0, got 1`
  - `the host is opaque for phases 0..5 :: expected 1, got 0`
  - `the curtain panels are off-screen at every phase from 2 to 6 :: null`
  - `the first painted frame is visible :: expected visible, got hidden`
  - `still visible during preloading :: expected visible, got hidden`
  - `the phase has reached 4 :: expected 4, got 3`
  - `degraded curtain starts visible :: expected visible, got hidden`
  - `the reserved title box stops before the right maid starts :: title ends at 1750.6840000000002, right maid starts at 1317.46576`
- 这些是**产品行为**断言（宿主 `data-state` 时序、CSS 级联推导出的 opacity/transform、标题预留框与右立绘的几何关系），不是打包引入的问题；其中若干项指向 `lib/client.js` 的样式/时序，需要其所有者判断是**代码缺陷**还是**断言本身过严**。我**未**改动 `lib/` 或 `scripts/assert.mjs`（均不在本任务范围内）。

### 5.2 私人路径泄漏（**中**，2 处绝对路径）

对解包后**全部 13 个文本文件**做绝对路径/用户标识扫描，命中 3 处（另有 1 处误报，见下）：

| 文件 | 行 | 内容 |
|---|---|---|
| `docs/ART-NOTES.md` | 3 | `C:\Users\wangshui\.dsh\profiles\desktop\node_modules\@smalltailqwq\dsh-client-ui-skin-maid-atelier` |
| `docs/VERIFICATION.md` | 228 | `C:\Users\wangshui\.dsh\profiles\desktop\node_modules\@smalltailqwq\dsh-client-ui-skin-maid-atelier\lib\client.js` |
| `package.json` | 48 | `"deepseek-harness"` — **误报**：这是 `keywords` 数组里的关键词，不是路径 |

- 两个 `docs/` 文件都**不在**本任务范围内，故未改动；建议其所有者改为相对路径或占位路径（例如 `<profile>/node_modules/@smalltailqwq/dsh-client-ui-skin-maid-atelier`）。
- 扫描范围与方法：解包后对**全部 13 个文本文件**（含无扩展名的 `LICENSE`）逐个做正则扫描，匹配模式为 `[A-Za-z]:\\+Users\\+<name>`、`[A-Za-z]:/+Users/+<name>`、`/(Users|home)/<name>/`、`AppData\\Local\\Temp`、`deepseek-harness`、`default-workspace`、`.packcheck`、`.npm-cache` 以及本机用户名。扫描脚本为临时探针，放在 `.packcheck/`（已 gitignore、不入包、不入库），可在需要时重跑。

## 6. 未验证项（诚实声明）

1. **真实浏览器与真机表现**：全部结论来自 Node 下的语法检查与假 DOM 断言，未在浏览器渲染引擎中目视核对布局、字号、窄屏重排与 `prefers-color-scheme` 分支。
2. **真实素材下的美术效果**：包内不含素材字节（这是有意的），素材由同源路由在运行时提供；即使装好也可能因皮肤插件未启用而 404 走降级幕。本次**未**在启用 maid-atelier 插件的环境里验证 200/404 与缓存头。
3. **安装到 profile 后的开机实测**：按任务要求**未**安装到任何 profile，也**未**重启用户客户端，因此注入时序、与宿主其它插件（尤其 dsh-550c-boot）的实机互斥行为均未实测。
4. **npm 安装体验**：只做到 `npm pack` 产出与解包复核，未在干净环境中 `npm i` 该 `.tgz` 验证依赖解析（该包 `peerDependencies` 全为 optional）。
5. **`assert.mjs` 的最终结论**：因文件在核查期间持续变动，本文只记录**快照与当时观测**；其最终通过与否需在其稳定后重跑第 4 条命令确认。

## 7. 本地 git 仓库

见仓库内提交记录。仓库以 `.gitignore` 排除 `node_modules/`、`.npm-cache/`、`.packcheck/`、`dist/*.tgz`、编辑器与系统临时文件；`.tgz` 属构建产物，不进版本库（其哈希记录在本文 §2）。

本机**没有**全局 git 身份配置，提交使用一次性内联身份，**未**写入全局或系统级 config：

```bash
git -c user.name="dsh-plugin-boot-whale-maid" -c user.email="noreply@localhost" commit -m "..."
```

**未推送远端、未创建 GitHub Release**：本机无 `gh` CLI 与 `GITHUB_TOKEN`，推送与 Release 按主控指示由后续步骤处理。

## 8. 复现本次复核

```bash
cd dsh-plugin-boot-whale-maid

# 1) 打包（默认缓存不可写，必须指定缓存目录）
npm pack --cache .npm-cache
mkdir -p dist && mv dsh-plugin-boot-whale-maid-0.1.0.tgz dist/    # Windows: move 到 dist\

# 2) 解包到临时目录
mkdir -p .packcheck && tar -xzf dist/dsh-plugin-boot-whale-maid-0.1.0.tgz -C .packcheck

# 3) 在解包目录内重跑四条验收
cd .packcheck/package
node --check lib/index.js
node --check lib/client.js
node scripts/smoke.mjs
node scripts/assert.mjs

# 4) 清理临时目录（.packcheck 已 gitignore，内含解包件与路径扫描探针）
cd ../.. && rm -rf .packcheck
```

---

## 9. 本次的判定

| 验收条件 | 结果 |
|---|---|
| 生成可安装的 `.tgz`（`npm pack`） | **通过**（`exit=0`，13 files） |
| 解包清单与 `files` 白名单逐条对照，入口与必要文件齐全、无多余文件 | **通过**（§3） |
| 解包件不含 `node_modules`／素材字节／临时探针 | **通过**（§3.1） |
| 解包件不含私人绝对路径 | **不通过**（§5.2，2 处绝对路径） |
| 解包后四条重跑全部退出码 0 | **不通过**（§4，第 4 条 `assert.mjs` 退出码 1） |
| 给出 `.tgz` 路径、大小与 SHA256 | **通过**（§2） |

**结论：交付物已产出且大部分核对通过，但上述两项未满足，故本包在修复前不可发布。** 阻塞项均为**包外所有者**的文件（`scripts/assert.mjs`、`lib/client.js` 的时序与样式、`docs/` 的两处路径），未在本任务范围内擅自改动。

