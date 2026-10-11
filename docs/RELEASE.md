# dsh-boot 0.3.1 · 修复新安装缺少 Q 版人物

此前 Q 版图片从用户本机的 maid-atelier 皮肤包读取；仅安装 dsh-boot 的用户会缺少小人物。0.3.1 将原蓝发 Q 版 WebP 随包携带，并通过本插件素材路由直接读取，不再依赖另外安装或启用原皮肤。

- 去掉 maid-atelier 可选依赖，主立绘、宫殿和 Q 版均随包安装。
- 原 Q 版图片未经修改，保留上善 → ZipZipPipe → Small-tailqwq 署名链与 CC BY-NC-SA 4.0 条件，随包附上许可全文和上游署名原文。
- 补充无原皮肤情况下 Q 版 GET、HEAD、缓存、哈希、尺寸、许可打包和损坏降级检查，并加入 `npm run verify`。
- 9.6 秒开场、2.6 秒减少动态效果模式、点击或 Esc 跳过保持原行为。窗口内容区域宽度 ≤720px 或高度 <520px 时仍会按布局规则隐藏 Q 版。

## 下载与升级

下载 `dsh-boot-0.3.1.tgz`，在原 profile 运行：

```bash
dsh plugin --profile desktop add ./dsh-boot-0.3.1.tgz
```

将 desktop 换成自己的 profile 名称，安装后完整退出并重新打开 DSH。包名不变，从 0.3.0 升级无需迁移配置；从旧包名升级参考 docs/MIGRATION.md。没有发布到 npm。

## 验证

- 最终 tgz 解包后，在没有 `node_modules` 或原皮肤包的目录运行 `npm run verify`：429/429 动画断言、67/67 smoke、36/36 素材与路由检查通过，客户端构建与经典脚本格式检查通过。
- 安装包包含 Q 版 WebP 原图（91,476 字节）和完整许可、署名文件；图片哈希与原版本引用的图片一致。
- 下载文件校验值见附件 `SHA256SUMS.txt`。
- 本次未在用户 DSH 中安装或重启；完整开机画面的实机验收仍需升级后进行。

代码 MIT；原 Q 版及含 Q 版的预览截图保留 CC BY-NC-SA 4.0 条件，详见 LICENSE、LICENSE-ARTWORK、docs/ATTRIBUTION.md 和 docs/UPSTREAM-NOTICE。
