# Installazione

Installa la versione firmata dal [Chrome Web Store](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba) o da [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/).

Per compilare i sorgenti, installa [Bun](https://bun.sh) ed esegui nella radice del repository:

```sh
bun install --frozen-lockfile
bun run build
```

La compilazione sostituisce `dist/`. In Chrome, apri `chrome://extensions/`, attiva la modalità sviluppatore e carica `dist/chrome/` con **Carica estensione non pacchettizzata**. In Firefox 142 o successivo, apri `about:debugging#/runtime/this-firefox` e carica temporaneamente `dist/firefox/manifest.json`. L'installazione temporanea termina alla chiusura di Firefox.

Puoi anche estrarre il ZIP del browser dalle [release](https://github.com/adinschmidt/AI-translator/releases). Non caricare la cartella dei sorgenti. Dopo la compilazione, ricarica estensione e pagina web.
