# Risoluzione dei problemi

- Carica `dist/chrome/` o `dist/firefox/manifest.json`, non i sorgenti. Firefox richiede almeno 142. Ricarica estensione e pagina dopo la compilazione; verifica la conferma di salvataggio.
- Usa un URL completo o ripristina l'endpoint predefinito. Usa HTTPS per servizi remoti. Per 401/403 verifica chiave, accesso e fatturazione.
- Aggiorna i modelli o inserisci un ID disponibile. Disattiva l'override se il ragionamento causa errori. Per «API returned no translation text», prova un altro modello o meno testo. Alcune risposte vuote vengono riprovate senza streaming.
- Attendi il ripristino della quota o cambia modello. Le pagine richiedono più richieste e i tentativi includono pause. **Interrompi** annulla l'esecuzione attiva.
- Avvia Ollama, scarica un modello con `ollama pull qwen3.5:4b` e usa `http://localhost:11434`. Per origini rifiutate configura `OLLAMA_ORIGINS` e riavvia. `OLLAMA_ORIGINS="*" ollama serve` consente tutte le origini.
- Se manca il pulsante, verifica impostazione e lingue. Usalo per la lingua avanzata e le istruzioni aggiuntive. Ricarica una pagina tradotta parzialmente.

Il debug aggiunge dettagli agli errori. Le console possono contenere chiavi e contenuti anche senza debug. Rimuovi dati sensibili prima di condividere log.
