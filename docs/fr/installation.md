# Installation

Installez la version signée depuis le [Chrome Web Store](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba) ou [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/).

Pour compiler les sources, installez [Bun](https://bun.sh), puis exécutez à la racine du dépôt :

```sh
bun install --frozen-lockfile
bun run build
```

La compilation remplace `dist/`. Dans Chrome, ouvrez `chrome://extensions/`, activez le mode développeur et chargez `dist/chrome/` avec **Charger l'extension non empaquetée**. Dans Firefox 142 ou ultérieur, ouvrez `about:debugging#/runtime/this-firefox` et chargez temporairement `dist/firefox/manifest.json`. Cette installation disparaît à la fermeture de Firefox.

Vous pouvez aussi extraire le ZIP du navigateur depuis les [versions publiées](https://github.com/adinschmidt/AI-translator/releases). Ne chargez pas le dossier source. Après compilation, rechargez l'extension et la page web.
