# Fehlerbehebung

## „Ungültige API-Endpunkt-URL“ in den Einstellungen

Stellen Sie sicher, dass der Endpunkt mit `https://` (oder `http://` für lokales Ollama) beginnt.
und ist eine vollständige URL. Verwenden Sie **Fill Default**, um den empfohlenen Wert wiederherzustellen.

## 401/403 Fehler

- Überprüfen Sie den API-Schlüssel in den Einstellungen noch einmal.
- Bestätigen Sie, dass der Schlüssel in der Anbieterkonsole aktiv ist.
- Bei einigen Anbietern muss die Abrechnung aktiviert sein, bevor Schlüssel verwendet werden können.

## Ratenlimits oder Kontingentfehler

Anbieter können Anfragen drosseln oder blockieren, wenn Sie die Grenzen Ihres Plans überschreiten.
Versuchen Sie es später noch einmal oder aktualisieren Sie Ihren Anbieterplan.

## Ollama-Modelle können nicht geladen werden

- Bestätigen Sie, dass Ollama ausgeführt wird: `ollama serve`.
- Legen Sie `OLLAMA_ORIGINS="*"` fest und starten Sie neu, um Erweiterungsanfragen zuzulassen.
  – Verwenden Sie den Standardendpunkt `http://localhost:11434`.

## Die ganzseitige Übersetzung sieht fehlerhaft aus

Die Ganzseitenübersetzung ist experimentell. Wenn ein Seitenlayout fehlerhaft ist, laden Sie die Registerkarte neu
um den ursprünglichen Inhalt wiederherzustellen und zu versuchen, eine kleinere Auswahl zu übersetzen.

## Die Erweiterung reagiert nicht

- Laden Sie die Erweiterung in `chrome://extensions/` oder `about:debugging` neu.
- Öffnen Sie die Seite **Optionen** erneut und stellen Sie sicher, dass die Einstellungen gespeichert werden.
