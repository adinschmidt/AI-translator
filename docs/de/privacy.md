# Datenschutz

Aktualisiert am 20. September 2026.

Die Erweiterung hat keinen vom Entwickler betriebenen Übersetzungsserver oder Analysedienst. Sie sendet ausgewählten Text oder Seitenbereiche und Anweisungen direkt an den eingestellten Endpunkt. Entfernte Anbieter verarbeiten Daten nach ihren Richtlinien; OpenRouter kann sie weiterleiten. Modellabfragen können deinen Schlüssel übertragen, ohne dass eine Übersetzung startet.

Schlüssel und Einstellungen liegen in `chrome.storage.sync`. Der Browser kann sie auf andere angemeldete Geräte kopieren. Das ist weder ausschließlich lokaler Speicher noch ein separater Geheimnisspeicher. Es gibt keinen dauerhaften Übersetzungsverlauf, aber Ergebnisse bleiben in Seiten, Fenstern und temporärem Arbeitsspeicher.

Ollama verwendet standardmäßig `http://localhost:11434`. Die Verarbeitung bleibt nur lokal, wenn Server und Modell nichts weiterleiten. Eigene Endpunkte erhalten Inhalt und Zugangsdaten. HTTP verschlüsselt die Übertragung nicht, HTTPS schon.

Die standardmäßig aktive Schwärzung erkennt einige E-Mail-Adressen, Telefonnummern, SSNs und SINs vor dem Senden, kann aber Daten übersehen. HTML-Attributwerte in Anführungszeichen werden durch Platzhalter ersetzt und lokal wiederhergestellt. Protokolle können auch ohne Debugging Schlüssel, Einstellungen, Originaltext, Metadaten und Übersetzungen enthalten. Die Schwärzung der Anfragen bereinigt nicht alle Protokolle.

`contextMenus` ergänzt Aktionen; `scripting` fügt Skripte ein; `storage` speichert Schlüssel und Einstellungen. `https://*/*` und `http://*/*` erlauben Seitenzugriff und Anbieteranfragen. Skripte laufen in passenden Frames; Seitenübersetzung startet nur im Hauptframe. ELD erkennt Sprachen lokal, DOMPurify ist enthalten.

Du kannst Anbieter wechseln, Schlüssel oder Erweiterungsdaten löschen und Übersetzungen stoppen. Synchronisierung kann Kopien behalten; Stoppen holt bereits gesendete Daten nicht zurück. Prüfe die Anbieterrichtlinien und entferne private Daten vor einer [Fehlermeldung](https://github.com/adinschmidt/AI-translator/issues).
