# Installation

Installiere die signierte Version aus dem [Chrome Web Store](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba) oder von [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/).

Für einen Build aus dem Quellcode installiere [Bun](https://bun.sh) und führe im Projektverzeichnis aus:

```sh
bun install --frozen-lockfile
bun run build
```

Der Build ersetzt `dist/`. Öffne in Chrome `chrome://extensions/`, aktiviere den Entwicklermodus und lade `dist/chrome/` über **Entpackte Erweiterung laden**. Öffne in Firefox ab Version 142 `about:debugging#/runtime/this-firefox` und lade `dist/firefox/manifest.json` als temporäres Add-on. Es wird beim Schließen von Firefox entfernt.

Alternativ kannst du das passende Browser-ZIP aus den [Releases](https://github.com/adinschmidt/AI-translator/releases) entpacken. Lade nicht den Quellcodeordner. Lade nach einem neuen Build die Erweiterung und Webseite neu.
