# インストール

署名済みの拡張機能は [Chrome ウェブストア](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba) または [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/) から入手できます。

ソースからビルドする場合は [Bun](https://bun.sh) をインストールし、リポジトリのルートで実行します。

```sh
bun install --frozen-lockfile
bun run build
```

ビルドは `dist/` を置き換えます。Chrome では `chrome://extensions/` でデベロッパーモードを有効にし、「パッケージ化されていない拡張機能を読み込む」で `dist/chrome/` を選びます。Firefox 142 以降では `about:debugging#/runtime/this-firefox` で一時的なアドオンとして `dist/firefox/manifest.json` を選びます。一時インストールは Firefox を閉じると解除されます。

[リリース](https://github.com/adinschmidt/AI-translator/releases)のブラウザー別 ZIP を展開して使うこともできます。ソースのルートを直接読み込まないでください。再ビルド後は拡張機能とウェブページを再読み込みします。
