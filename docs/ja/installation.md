# インストール

## Chrome / Chromium ベースのブラウザ

1. このリポジトリをダウンロードまたは clone します。
2. `chrome://extensions/` を開きます。
3. **Developer mode**（右上のトグル）を有効にします。
4. **Load unpacked** をクリックし、拡張機能フォルダを選択します。

## Firefox

1. このリポジトリをダウンロードまたは clone します。
2. `about:debugging#/runtime/this-firefox` を開きます。
3. **Load Temporary Add-on** をクリックします。
4. 拡張機能フォルダ内の `manifest.json` を選択します。

::: tip
Firefox の一時アドオンは、ブラウザを閉じると削除されます。恒久的にインストールするには、Mozilla による署名が必要です。あるいは Firefox Developer / Nightly で `xpinstall.signatures.required` を `false` に設定してインストールできます。
:::
