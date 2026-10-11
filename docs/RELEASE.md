# dsh-boot 0.3.0

插件包名精简为 dsh-boot，开场标题为“深度求索”，副标题为 DEEPSEEK。

本版本带来蓝白御姐主立绘、深海宫殿、9.6 秒从容入场，以及尊重系统减少动态效果的 2.6 秒静态开场。原蓝发 Q 版从本机已安装的 maid-atelier 包读取，原皮肤可以停用；Q 版缺失不会隐藏主立绘。

修复 DSH 客户端加载器入口，使用经过格式校验的经典脚本 factory；保留点击和 Esc 跳过及异常清理。

## 下载与升级

下载 dsh-boot-0.3.0.tgz 后运行：

```bash
dsh plugin --profile desktop add ./dsh-boot-0.3.0.tgz
```

从 dsh-plugin-boot-whale-maid 升级时先备份配置并停用旧包；新旧包只启用一个。详见 docs/MIGRATION.md。安装后完整退出并重新启动 DSH。没有发布到 npm。

## 最终产物

- 5,096,079 字节，22 个文件，仅携带两张本项目生成的 PNG。
- SHA-256：8E57A14F2AE21DD93D678C2A00DD5F1D453DF9CC4CE1642B807C6977DFAEEB08
- 最终 tgz 解包后：429/429 动画断言、67/67 smoke、23/23 素材与路由检查通过，经典脚本 factory 格式通过。
- 独立浏览器核对 dsh-boot 加载器 ID、“深度求索”四字、DEEPSEEK、主立绘与原 Q 版正常解码，真实截图已查看。
- 用户机器此前安装的 0.2.4 文件及素材读取检查通过；本次短包名 0.3.0 尚未迁移安装，实际 DSH 重启验收待完成。

代码 MIT；原 Q 版不在 tgz 内，其运行时读取和含 Q 版截图保留 CC BY-NC-SA 4.0 条件及署名，详见 LICENSE 和 docs/ATTRIBUTION.md。
