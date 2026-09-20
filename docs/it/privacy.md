# Privacy

Aggiornato il 20 settembre 2026.

L'estensione non usa server di traduzione o servizi analitici del suo sviluppatore. Invia testo selezionato o regioni della pagina e istruzioni all'endpoint configurato. I fornitori remoti applicano le proprie politiche; OpenRouter può inoltrare le richieste. Anche la ricerca di modelli può inviare la chiave senza avviare traduzioni.

Chiavi e impostazioni usano `chrome.storage.sync`: il browser può copiarle su altri dispositivi. Non è archiviazione esclusivamente locale né una cassaforte separata. Non esiste una cronologia persistente delle traduzioni, ma risultati restano nella pagina, nelle finestre e nella memoria temporanea.

Ollama usa `http://localhost:11434` per impostazione predefinita. Resta locale solo se server e modello non inoltrano richieste. Endpoint personalizzati ricevono contenuto e credenziali. HTTP non cifra il trasporto; HTTPS sì.

L'oscuramento automatico cerca email, telefoni, SSN e SIN prima dell'invio, ma può omettere informazioni. I valori degli attributi HTML tra virgolette vengono sostituiti con segnaposto e ripristinati localmente. I log possono includere chiavi, impostazioni, testo originale, metadati e traduzioni anche senza debug. L'oscuramento delle richieste non ripulisce tutti i log.

`contextMenus` aggiunge azioni; `scripting` inserisce script; `storage` salva chiavi e preferenze. `https://*/*` e `http://*/*` permettono accesso alle pagine e ai fornitori. Gli script funzionano nei riquadri compatibili; la traduzione completa parte solo dal principale. ELD rileva lingue localmente e DOMPurify è incluso.

Puoi cambiare fornitore, eliminare chiavi o dati dell'estensione e interrompere traduzioni. La sincronizzazione può conservare copie; interrompere non ritira dati già inviati. Controlla la politica del fornitore e rimuovi dati privati prima di aprire una [segnalazione](https://github.com/adinschmidt/AI-translator/issues).
