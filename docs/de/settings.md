# Einstellungen

Öffnen Sie das Erweiterungsmenü und klicken Sie auf **Optionen**, um AI Translator zu konfigurieren.

## Modi

### Grundmodus

- Wählen Sie einen Anbieter (OpenAI, Anthropic oder Google).
- Geben Sie einen API-Schlüssel ein.
- Wählen Sie Ihre Zielsprache.
  – Die Erweiterung verwendet automatisch empfohlene Endpunkte und Modelle.

### Erweiterter Modus

- Wählen Sie aus allen unterstützten Anbietern.
- Passen Sie API-Endpunkt, Modellnamen und Übersetzungsanweisungen an.
- Ideal für selbst gehostete, OpenAI-kompatible oder Power-User-Setups.

## Übersetzungsanweisungen

Verwenden Sie **Übersetzungsanweisungen**, um Ton und Stil zu steuern. Der ausgewählte Text ist
automatisch angehängt. Beispiel:

```
Translate to Spanish. Keep the tone friendly and concise.
```

## API-Endpunkt und -Modell

Jeder Anbieter verfügt über die Option **Fill Default**, die den empfohlenen Wert wiederherstellt
Endpunkt und Modellname. Sie können beides bei Bedarf im erweiterten Modus überschreiben.

## Speicherung und Privatsphäre

Die Einstellungen werden in `chrome.storage.sync` gespeichert, sodass sie auf allen Geräten bestehen bleiben.
API-Schlüssel werden niemals in der Konsole protokolliert.
