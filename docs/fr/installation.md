# Installation

## Chrome / Navigateurs basés sur Chromium

1. Téléchargez ou clonez ce référentiel.
2. Accédez à `chrome://extensions/`.
3. Activez le **Mode développeur** (bascule en haut à droite).
4. Cliquez sur **Charger décompressé** et sélectionnez le dossier d'extension.

## Firefox

1. Téléchargez ou clonez ce référentiel.
2. Accédez à `about:debugging#/runtime/this-firefox`.
3. Cliquez sur **Charger le module complémentaire temporaire**.
4. Sélectionnez le fichier `manifest.json` dans le dossier d'extension.

::: tip
Les modules complémentaires temporaires de Firefox sont supprimés à la fermeture du navigateur. Pour permanent
installation, l'extension doit être signée par Mozilla ou installée dans Firefox
Développeur/Nuit avec `xpinstall.signatures.required` défini sur `false`.
:::
