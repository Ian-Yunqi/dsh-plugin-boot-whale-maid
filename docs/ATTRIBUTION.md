# ATTRIBUTION — 署名链与许可说明

本文件面向 `dsh-plugin-boot-whale-maid` 插件包，说明其启动出场动画所引用的美术素材的**完整署名链**与**许可条款**。

- 素材原始版权与许可：**CC BY-NC-SA 4.0**（Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International，中文常译“署名—非商业性使用—相同方式共享 4.0 国际”）。
- 素材出处包：`@smalltailqwq/dsh-client-ui-skin-maid-atelier`（maid-atelier · 深海女仆工坊 · Abyssal Maid Atelier）。
- 素材获取方式：**仅通过该包已注册的同源路由 `/skin-assets/maid-atelier/<hash>.webp` 以 URL 引用**，本插件**不复制、不再分发**该包的任何文件或图片字节。

---

## 1. 完整三创署名链（逐字转录自原包 `NOTICE`）

> 以下为原包 `NOTICE` 中署名链部分的**逐字转录**，保留原文中英混排、标点与链接，不作改写。

```
Third-party derivative notice (CC BY-NC-SA 4.0 attribution chain)

This skin's artwork is a tertiary derivative. Per the ShareAlike and
Attribution requirements of CC BY-NC-SA 4.0, every upstream author in the
chain is credited:

1. 一创 (initial creation): 上善 —— 鲸鱼娘 (whale-girl) 角色形象的原作者。
   个人主页 (profile): https://www.pixiv.net/users/62155430
   The original whale-girl character design.

2. 二创 (secondary creation): ZipZipPipe —— 在上善的鲸鱼娘形象基础上加入
   DeepSeek 元素的女仆鲸鱼娘 (maid whale-girl) 二次设计（生成模型：GPT Image 2）。
   个人主页 (profile): https://www.pixiv.net/users/18604994
   The maid whale-girl redesign adding DeepSeek elements, based on 上善's
   whale-girl (generated with GPT Image 2).

3. 三创 (this skin): Small-tailqwq (dsh-external/dsh-deep-whale) —— 本皮肤
   使用的素材为该形象的 DeepSeek 元素再设计。
   The DeepSeek-element secondary design used in this skin.
```

署名链概览：

**上善（一创，鲸鱼娘角色形象原作者） → ZipZipPipe（二创，加入 DeepSeek 元素的女仆鲸鱼娘再设计） → Small-tailqwq（三创，本皮肤所使用素材的 DeepSeek 元素再设计）**

- 上善 个人主页（pixiv）：<https://www.pixiv.net/users/62155430>
- ZipZipPipe 个人主页（pixiv）：<https://www.pixiv.net/users/18604994>

### 1.1 原包 `NOTICE` 中的素材使用条款（逐字转录）

```
Artwork usage terms (LICENSE-ARTWORK): CC BY-NC-SA 4.0 —— 署名 (attribution) 必须保留以上完整创作链；
非商业性使用 (non-commercial only)；衍生作品必须以相同方式共享 (share-alike)。

Software code is covered by LICENSE (MIT). Artwork copyright remains with the
respective authors above, including embedded and transformed copies.
```

### 1.2 原包 `NOTICE` 其余相关段落（转录，保留上下文）

```
maid-atelier (深海女仆工坊 · Abyssal Maid Atelier)
====================================================

   启动错误页立绘（assets/boot-error/，2026-09-06）：根据用户提供的上述
   双角色参考图，使用 OpenAI imagegen 重新生成，采用本地洋红抠图制作透明层。
   角色设计沿用以上署名链；生成提示词与处理方式见该目录 PROMPTS.md。

   网页与应用图标（assets/icons/，2026-09-07）：由 Small-tailqwq 提供三张
   鲸鱼娘表情原图；保留原图，通过本地脚本抠除浅色背景并处理边缘，等比缩放及
   透明留边生成 PNG / ICO，沿用以上署名链。处理脚本为 scripts/build-maid-icons.py。
   插件菜单图标 assets/plugin-icon.png 为其中 delighted-192.png 的原字节副本。
```

原包 `LICENSE-ARTWORK` 首部标题行（许可名称的正式英文写法）：

```
Artwork license; see NOTICE for attribution and scope.

Attribution-NonCommercial-ShareAlike 4.0 International
```

---

## 2. 许可条款要点（CC BY-NC-SA 4.0）

转录自原包 `LICENSE-ARTWORK`（Creative Commons 官方许可全文）中的关键条款：

**署名（Attribution，Section 3(a)(1)）**：若分享本许可素材（含修改后的形式），必须保留由许可方随素材提供的：创作者标识、版权声明、指向本许可的声明、指向免责声明的声明、以及在合理可行范围内指向素材的 URI 或超链接；并须标明是否作过修改；且须注明素材依本许可授权并提供本许可的文本或链接。

> 原文（`LICENSE-ARTWORK` Section 3(a)(1)）："If You Share the Licensed Material (including in modified form), You must: a. retain the following if it is supplied by the Licensor with the Licensed Material: i. identification of the creator(s) … ii. a copyright notice; iii. a notice that refers to this Public License; iv. a notice that refers to the disclaimer of warranties; v. a URI or hyperlink to the Licensed Material … b. indicate if You modified the Licensed Material … c. indicate the Licensed Material is licensed under this Public License, and include the text of, or the URI or hyperlink to, this Public License."

**非商业性使用（NonCommercial）**：不得将素材用于**主要指向商业优势或金钱报酬**的用途。

> 原文（`LICENSE-ARTWORK` Section 1(k)）："**NonCommercial means not primarily intended for or directed towards commercial advantage or monetary compensation.** For purposes of this Public License, the exchange of the Licensed Material for other material subject to Copyright and Similar Rights by digital file-sharing or similar means is NonCommercial provided there is no payment of monetary compensation in connection with the exchange."

**相同方式共享（ShareAlike，Section 3(b)）**：若分享基于素材产生的演绎作品（Adapted Material），所适用的适配者许可必须是**具有相同许可要素**的 Creative Commons 许可（本版本或更新版本）或 BY-NC-SA 兼容许可；必须包含该适配者许可的文本或链接；且不得对演绎作品附加额外或不同的条款，也不得施加有效技术措施以限制许可授予的权利。

> 原文（`LICENSE-ARTWORK` Section 3(b)）："In addition to the conditions in Section 3(a), if You Share Adapted Material You produce, the following conditions also apply. 1. The Adapter's License You apply must be a Creative Commons license with the same License Elements, this version or later, or a BY-NC-SA Compatible License. 2. You must include the text of, or the URI or hyperlink to, the Adapter's License You apply. … 3. You may not offer or impose any additional or different terms or conditions on, or apply any Effective Technological Measures to, Adapted Material that restrict exercise of the rights granted under the Adapter's License You apply."

**三个要素的落地约束**（本项目必须遵守）：

| 要素 | 对本插件的要求 |
|---|---|
| 署名 (BY) | 保留 `上善 → ZipZipPipe → Small-tailqwq` 完整创作链、两个 pixiv 主页链接、许可名称与免责声明指引；标明素材未由本插件修改（本插件只做展示，见 §4） |
| 非商业 (NC) | 本插件及其分发不得用于商业优势或金钱报酬场景；若整体被打包进商业产品，需另行取得授权 |
| 相同方式共享 (SA) | 若本插件以任何方式**再分发**这些素材或由素材产生的演绎物（例如内联、改色、重绘、打包离线副本），该再分发部分必须以同名 CC BY-NC-SA 4.0 或兼容许可授权，并附许可文本/链接 |

---

## 3. 素材来源与加载方式

- 引用对象（6 项，逐项 hash 与来源行见 `docs/assets.json`）：
  - `maid-left` `lib/client.js:38`、`maid-right` `lib/client.js:39`、`vision` `lib/client.js:56`
  - `palace-light` `lib/client.js:36`、`palace-dark` `lib/client.js:37`、`chibi` `lib/client.js:18`
- 加载路径：客户端以 `new URL('skin-assets/maid-atelier/<hash>.webp', document.baseURI).href` 解析（原包 `lib/client.js:9-11`），由 maid-atelier 主插件注册的同源前缀路由 `/skin-assets/maid-atelier` 提供（原包 `lib/index.js:4-6, 53-85, 90`），服务端仅对白名单内、文件名为 `<64位hex>.webp|.png` 的请求返回 `200`，否则 `404`；响应带 `Cache-Control: public, max-age=31536000, immutable` 与 `ETag "<hash>"`。
- 因此素材加载**与原包共用同源路由**，不经过任何第三方 CDN，也不产生新的副本。

---

## 4. 本插件对素材的处理边界

- **不复制**：本插件不把 `@smalltailqwq/dsh-client-ui-skin-maid-atelier` 的任何文件或图片字节复制进自身交付物，不内联 base64，不做本地缓存副本；`dsh-plugin-boot-whale-maid/docs/` 中只有文本与 JSON，不含任何位图。
- **仅以 URL 引用**：动画只通过上述同源 URL 引用 6 张图，运行时由浏览器向该路由发起请求。
- **未修改素材**：仅做 `cover`/`contain` 等比适配与定位（不裁切人物、不拉伸、不调色），不改写像素内容；如后续实现引入任何改色/重绘，即构成演绎作品，必须按 §2 的 SA 条款以 CC BY-NC-SA 4.0 授权并保留完整链条。
- **许可义务不因“只用 URL”而免除**：仅通过 URL 引用**不等于**取得了许可豁免，也**不自动满足或免除** CC BY-NC-SA 4.0 的任何义务。署名、非商业、相同方式共享三项约束**仍然完整适用**于本插件对素材的使用与展示（CC 官方对该情形给出的通行解释是：提供指向包含所需信息的资源的 URI/超链接是满足署名要求的一种合理方式——见 Section 3(a)(2)——但这只是**满足**署名义务的手段，绝不是**免除**许可义务的理由）。任何再分发素材或演绎物的行为，都必须重新满足 §2 的全部要素。
- **可用性依赖**：该路由仅在 maid-atelier 皮肤插件已安装并启用时存在，缺失时为 `404`。这属于运行时依赖，**不改变**上述任何许可义务。

---

## 5. 插件代码许可与素材许可分别说明

**两套许可相互独立，务必分开理解：**

1. **本插件自身代码**（`dsh-plugin-boot-whale-maid` 的源码、构建脚本、上下文无关的样式逻辑等）**不沿用素材许可**，其许可由本包根目录的 `LICENSE` 与 `package.json` 字段**单独声明**（该声明由实现侧决定，不在本审计任务范围内，本文件不对其取值作任何断言）。无论最终选择何种代码许可（含 MIT 等宽松许可），其效力**仅及于代码本身**。
2. **美术素材**（上述 6 张 WebP 及其版权）**始终为 CC BY-NC-SA 4.0**，不因代码许可的选择而被重新授权、被转授或被放宽；素材版权仍归其各自作者所有。
3. 若本插件包同时包含代码与素材，则须**在同一分发包内并列呈现两套许可**：代码许可（针对代码）+ 本文件与 CC BY-NC-SA 4.0 全文（针对素材），不得用代码许可去覆盖素材许可。
4. 本插件未修改素材，故本插件不成为素材的“许可方”；不得声称对素材拥有版权或可再许可（sublicense）他人使用素材。

---

## 6. 免责声明

素材按“现状”提供，原许可方与上游作者不提供任何形式的担保（见 `LICENSE-ARTWORK` Section 5）。本文件是对原包 `NOTICE` / `LICENSE-ARTWORK` 的转录与适用说明，不构成法律意见；如涉商业使用或大规模再分发，请自行取得相关权利人授权。
