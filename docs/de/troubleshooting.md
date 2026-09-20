# Fehlerbehebung

- Lade `dist/chrome/` oder `dist/firefox/manifest.json`, nicht die Quellen. Firefox benötigt Version 142 oder neuer. Lade Erweiterung und Seite nach dem Build neu; prüfe die Speicherbestätigung.
- Verwende eine vollständige Endpunkt-URL oder setze den Standardwert ein. Nutze HTTPS für entfernte Dienste. Prüfe bei 401/403 Schlüssel, Berechtigungen und Abrechnung.
- Aktualisiere Modelle oder gib eine für dein Konto verfügbare ID ein. Schalte bei Reasoning-Fehlern die Vorgabe aus. Probiere bei „API returned no translation text“ ein anderes Modell oder weniger Text. Manche leeren Antworten werden ohne Streaming erneut versucht.
- Warte bei Quotenbegrenzungen oder wechsle das Modell. Seiten benötigen mehrere Anfragen; Wiederholungen erfolgen mit Wartezeiten. **Stopp** bricht den aktiven Durchlauf ab.
- Starte für Ollama den Server, lade mit `ollama pull qwen3.5:4b` ein Modell und nutze `http://localhost:11434`. Falls der Ursprung abgelehnt wird, setze `OLLAMA_ORIGINS` und starte neu. `OLLAMA_ORIGINS="*" ollama serve` erlaubt alle Ursprünge.
- Fehlt die Schaltfläche, prüfe deren Einstellung und die erkannten Sprachen. Nutze sie für die erweiterte Zielsprache und Zusatzanweisungen. Lade teilweise übersetzte Seiten neu.

Debugging ergänzt Fehlerdetails. Seiten- und Erweiterungskonsolen können auch ohne Debugging Schlüssel und Text enthalten. Entferne sensible Daten vor dem Teilen von Protokollen.
