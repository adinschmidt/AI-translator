# Installation

## Chrome/Chromium-basierte Browser

1. Laden Sie dieses Repository herunter oder klonen Sie es.
2. Gehen Sie zu `chrome://extensions/`.
3. Aktivieren Sie den **Entwicklermodus** (Schalter oben rechts).
4. Klicken Sie auf **Entpackt laden** und wählen Sie den Erweiterungsordner aus.

## Firefox

1. Laden Sie dieses Repository herunter oder klonen Sie es.
2. Gehen Sie zu `about:debugging#/runtime/this-firefox`.
3. Klicken Sie auf **Temporäres Add-on laden**.
4. Wählen Sie die Datei `manifest.json` im Erweiterungsordner aus.

::: tip
Temporäre Add-ons in Firefox werden entfernt, wenn der Browser geschlossen wird. Für dauerhaft
Bei der Installation muss die Erweiterung von Mozilla signiert oder in Firefox installiert werden
Developer/Nightly mit `xpinstall.signatures.required` auf `false` eingestellt.
:::
