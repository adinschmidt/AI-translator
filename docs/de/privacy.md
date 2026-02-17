# Datenschutzrichtlinie für AI Translator

**Letzte Aktualisierung:** 10. Januar 2026

## 1. Übersicht

AI Translator („wir“, „unser“ oder „die Erweiterung“) ist eine clientseitige Browsererweiterung
Dadurch können Benutzer Texte mithilfe ihrer eigenen KI-API-Schlüssel übersetzen. Die Erweiterung
läuft vollständig in Ihrem Browser und übermittelt keine Daten an irgendwelche Server
Eigentum des Entwicklers oder von ihm betrieben.

**Dies ist keine Rechtsberatung.** Diese Richtlinie beschreibt, wie die Erweiterung gehandhabt wird
Daten, die Ihnen helfen sollen, eine fundierte Entscheidung über deren Verwendung zu treffen.

## 2. Datenerfassung und -speicherung

- **Persönliche Daten:** Wir (der Entwickler) sammeln, speichern und haben keinen Zugriff darauf
  persönliche Daten, übersetzte Texte oder Browserverlauf.
- **API-Schlüssel:** Ihre API-Schlüssel werden ausschließlich auf Ihrem Gerät gespeichert
  Synchronisierter Speicher des Browsers (`browser.storage.sync`). Das bedeutet Ihr
  Die Einstellungen werden in Ihren Browsern synchronisiert, wenn Sie angemeldet sind, dies ist jedoch nie der Fall
  an den Entwickler oder einen anderen Dritten als die spezifische KI übermittelt werden
  Anbieter, den Sie für Übersetzungsanfragen wählen.
- **Kein Backend-Server:** Diese Erweiterung betreibt keinen Backend-Server. Alle
  Die Verarbeitung erfolgt lokal in Ihrem Browser.

## 3. Datenweitergabe an Dritte

Um zu funktionieren, sendet diese Erweiterung den Text, den Sie explizit zur Übersetzung auswählen
direkt von Ihrem Browser an den von Ihnen konfigurierten KI-Anbieter. Durch die Verwendung
Mit dieser Erweiterung erkennen Sie an, dass Ihre Daten dem Datenschutz unterliegen
Richtlinien dieser Anbieter:

| Anbieter               | Datenschutzrichtlinie                                                              |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **OpenAI**             | [https://openai.com/privacy](https://openai.com/privacy)                           |
| **Anthropic**          | [https://www.anthropic.com/legal/privacy](https://www.anthropic.com/legal/privacy) |
| **Google (Gemini)** | [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)   |
| **xAI (Grok)**         | [https://x.ai/legal/privacy-policy](https://x.ai/legal/privacy-policy)             |
| **OpenRouter**         | [https://openrouter.ai/privacy](https://openrouter.ai/privacy)                     |
| **Ollama (Lokal)**     | Die Daten bleiben auf Ihrem lokalen Computer; keine externe Übertragung.           |

**Wichtige Überlegungen:**

- Einige Anbieter verwenden Ihre Daten möglicherweise zum Trainieren ihrer Modelle, sofern Sie sich nicht dagegen entscheiden
  (überprüfen Sie die Richtlinien jedes Anbieters).
- OpenRouter leitet Anfragen an verschiedene zugrunde liegende KI-Anbieter weiter, jeder mit seinen eigenen
  eigene Datenrichtlinien.
- Wir verkaufen, handeln oder übertragen Ihre Daten nicht auf andere Weise an Dritte.

## 4. Browser-Store-Richtlinien

Bei der Verbreitung über Browser-Erweiterungsspeicher entspricht diese Erweiterung den
geltende Benutzerdatenrichtlinien, einschließlich [Chrome Web Store Benutzerdatenrichtlinie](https://developer.chrome.com/docs/webstore/program-policies/) und [Firefox-Add-on-Richtlinien](https://extensionworkshop.com/documentation/publish/add-on-policies/).

## 5. Erläuterung der Berechtigungen

Diese Erweiterung fordert die folgenden Berechtigungen an:

| Erlaubnis                         | Zweck                                                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contextMenus`                    | Fügt Ihrem Rechtsklick-Menü die Option „Übersetzen“ hinzu                                                                                          |
| `scripting`                       | Fügt das Übersetzungs-UI-Overlay auf Webseiten ein                                                                                                 |
| `storage`                         | Speichert Ihre API-Schlüssel und Einstellungen lokal                                                                                               |
| `host_permissions` (`<all_urls>`) | Erforderlich, um Übersetzungen auf jeder von Ihnen besuchten Webseite anzuzeigen und API-Aufrufe an den von Ihnen gewählten KI-Anbieter zu tätigen |

## 6. Benutzerkontrolle

- **Löschung:** Sie können alle von dieser Erweiterung gespeicherten Daten durch Deinstallation entfernen

die Erweiterung oder das Löschen der Erweiterungsdaten Ihres Browsers.

- **Opt-out:** Es werden keine Daten an KI-Anbieter gesendet, es sei denn, Sie lösen explizit eine aus
  Übersetzungsaktion.
- **Anbieterwahl:** Sie steuern, welcher KI-Anbieter Ihre Daten erhält
  Wählen Sie es in den Erweiterungseinstellungen aus.

## 7. Sicherheit

- API-Schlüssel werden im sicheren Speicher des Browsers gespeichert und nur übertragen
  über HTTPS an die Endpunkte des KI-Anbieters.
  – Die Erweiterung protokolliert, speichert oder speichert den übersetzten Text danach nicht mehr
  es anzuzeigen.

## 8. Änderungen dieser Richtlinie

Wir können diese Datenschutzrichtlinie von Zeit zu Zeit aktualisieren. Änderungen werden berücksichtigt
finden Sie im Datum „Letzte Aktualisierung“ oben in diesem Dokument.

## 9. Kontakt

Wenn Sie Fragen zu dieser Richtlinie haben, öffnen Sie bitte ein Issue im
[GitHub-Repository](https://github.com/adinschmidt/AI-translator/issues).

---

_Diese Erweiterung ist Open Source. Sie können den Code überprüfen, um diese Privatsphäre zu überprüfen
Ansprüche._
