# Installazione

## Chrome/Browser basati su Chromium

1. Scarica o clona questo repository.
2. Vai a `chrome://extensions/`.
3. Abilita la **Modalità sviluppatore** (interruttore in alto a destra).
4. Fare clic su **Carica non imballato** e selezionare la cartella dell'estensione.

## Firefox

1. Scarica o clona questo repository.
2. Vai a `about:debugging#/runtime/this-firefox`.
3. Fare clic su **Carica componente aggiuntivo temporaneo**.
4. Selezionare il file `manifest.json` nella cartella dell'estensione.

::: tip
I componenti aggiuntivi temporanei di Firefox vengono rimossi alla chiusura del browser. Per permanente
installazione, l'estensione deve essere firmata da Mozilla o installata in Firefox
Sviluppatore/Notturno con `xpinstall.signatures.required` impostato su `false`.
:::
