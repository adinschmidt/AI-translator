# Einstellungen

Klicke auf das Erweiterungssymbol. Änderungen werden automatisch gespeichert. Die Oberflächensprache ist unabhängig von der Zielsprache; wähle eine von 12 Sprachen oder die Browsersprache. Das Design kann hell, dunkel oder systemabhängig sein.

Der Basismodus bietet OpenAI, Anthropic und Google. Der erweiterte Modus bietet 11 Anbieter und speichert Schlüssel, Modell, Endpunkt und Reasoning je Anbieter. Beide Modi behalten eine eigene Zielsprache, anfangs Englisch, und erlauben freie Spracheingaben. Speichern im Basismodus setzt Modell und Endpunkt des Anbieters auf die Standardwerte zurück.

**Modelle aktualisieren** fragt den Anbieter ab. Auch Änderungen an Anbieter, Schlüssel oder Endpunkt können die Liste laden. Bei Fehlern erscheinen integrierte Vorschläge. Du kannst filtern oder eine Modell-ID eingeben. **Standardwert einsetzen** setzt das jeweilige Feld zurück.

## Sprache und Anweisungen

Die Schaltfläche an der Textauswahl verwendet die Zielsprache und zusätzliche Anweisungen des erweiterten Modus, etwa „Fachbegriffe beibehalten“. Kontextmenü und Seitenübersetzung verwenden gespeicherte Anbieteranweisungen. Sie berücksichtigen diese zusätzlichen Anweisungen nicht und folgen der erweiterten Zielsprache nicht zuverlässig; das Ergebnis kann Englisch sein.

## Reasoning und Verhalten

Im erweiterten Modus bietet **Override reasoning** die Werte `none`, `minimal`, `low`, `medium`, `high` und `xhigh`, anfangs `low`. Ausgeschaltet gelten kostensparende Übersetzungsvorgaben für empfohlene Modelle, sonst die Anbietervorgaben. Nicht unterstützte Stufen können ignoriert oder abgelehnt werden. Qwen Flash schaltet mit None das Denken aus und mit anderen Stufen ein.  Der Basismodus wendet die Vorgabe nicht an. Modelle können Werte ignorieren oder ablehnen. Mehr Reasoning kann Kosten und Wartezeit erhöhen. Die Erweiterung setzt keine Ausgabetoken-Grenze; Anbietergrenzen gelten weiterhin.

Die erweiterten Schalter steuern die Auswahlschaltfläche, standardmäßig an; das Offenhalten mehrerer Fenster, aus; die Schwärzung sensibler Daten, an; und Debugging, aus. Die Schwärzung erkennt bestimmte E-Mail-Adressen, Telefonnummern, US-SSNs und kanadische SINs, kann aber Daten übersehen. Geschwärzter Text bleibt im Ergebnis geschwärzt.

Schlüssel und Einstellungen verwenden `chrome.storage.sync` und können zwischen Geräten synchronisiert werden. Protokolle können auch ohne Debugging Schlüssel und Inhalte enthalten. Siehe [Datenschutz](/de/privacy).
