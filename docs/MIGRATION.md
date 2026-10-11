# dsh-boot 短包名迁移

0.3.0 将技术包名由 dsh-plugin-boot-whale-maid 改为 dsh-boot；开场标题“深度求索”、9.6 秒节奏、配色和人物素材保持不变。

1. 备份 profile 的 package.json、pnpm-lock.yaml、cordis.yml、cordis.patch.yml 和已安装旧插件。
2. 停用旧包：启用的 bundles 中移除 dsh-plugin-boot-whale-maid；有直接加载旧包的配置行时一并移除。不要同时启用新旧开场。
3. 使用 DSH 官方 CLI 安装下载的 dsh-boot-0.3.1.tgz。CLI 可能重新生成 cordis.yml；已有通过 bundles 与 patch 组合的 profile 应核对根配置，保留用户自定义 patch。
4. 检查新包版本、客户端入口、素材字节和已启用的包名。
5. 在用户方便时完整退出并重新启动 DSH，检查主立绘、小人物、标题、跳过以及正常进入工作界面。

回滚时停用新包、恢复备份配置并安装旧 tgz。仅替换配置文件不能代替恢复正确的依赖与锁文件。

本次用户机器已经安装并检查的是旧技术包名 0.2.4-local.1，尚未自动迁移或重启；0.3.0 是新的短包名发行包。

## 从 0.3.0 升级到 0.3.1

在原 profile 运行 `dsh plugin --profile desktop add ./dsh-boot-0.3.1.tgz`，将 desktop 替换为自己的 profile 名称，然后完整退出并重新启动 DSH。包名不变，无需迁移配置。Q 版图片现在随包携带，无需另外安装或启用 maid-atelier；已经安装原皮肤的用户也无需移除它。
