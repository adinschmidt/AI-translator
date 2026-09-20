# Установка

Установите подписанную версию из [Chrome Web Store](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba) или [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/).

Для сборки исходников установите [Bun](https://bun.sh) и выполните в корне репозитория:

```sh
bun install --frozen-lockfile
bun run build
```

Сборка заменяет `dist/`. В Chrome откройте `chrome://extensions/`, включите режим разработчика и загрузите `dist/chrome/` как распакованное расширение. В Firefox 142 или новее откройте `about:debugging#/runtime/this-firefox` и временно загрузите `dist/firefox/manifest.json`. Временное дополнение удаляется при закрытии Firefox.

Можно также распаковать ZIP нужного браузера из [релизов](https://github.com/adinschmidt/AI-translator/releases). Не загружайте папку исходников. После сборки перезагрузите расширение и веб-страницу.
