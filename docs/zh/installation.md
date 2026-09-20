# 安装

从 [Chrome 应用商店](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba) 或 [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/) 安装签名版本。

若要从源码构建，请安装 [Bun](https://bun.sh)，然后在仓库根目录运行：

```sh
bun install --frozen-lockfile
bun run build
```

构建会替换 `dist/`。在 Chrome 中打开 `chrome://extensions/`，启用开发者模式，通过“加载已解压的扩展程序”选择 `dist/chrome/`。Firefox 需要 142 或更新版本，在 `about:debugging#/runtime/this-firefox` 临时加载 `dist/firefox/manifest.json`。关闭 Firefox 后临时安装会移除。

也可以解压[发行版](https://github.com/adinschmidt/AI-translator/releases)中对应浏览器的 ZIP。不要直接加载源码根目录。重新构建后，请重新加载扩展并刷新网页。
