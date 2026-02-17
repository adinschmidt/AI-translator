# 安装

## Chrome / 基于 Chromium 的浏览器

1. 下载或克隆此存储库。
2. 转到`chrome://extensions/`。
3. 启用**开发者模式**（右上角切换）。
4. 单击**加载解压**并选择扩展文件夹。

## 火狐浏览器

1. 下载或克隆此存储库。
2. 转到`about:debugging#/runtime/this-firefox`。
3. 单击“**加载临时插件**”。
4. 选择扩展文件夹中的`manifest.json` 文件。

::: tip
当浏览器关闭时，Firefox 中的临时加载项将被删除。对于永久的
安装时，扩展必须经过 Mozilla 签名或安装在 Firefox 中
开发人员/每晚，将 `xpinstall.signatures.required` 设置为 `false`。
:::
