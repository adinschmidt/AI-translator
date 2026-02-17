# Risoluzione dei problemi

## "URL endpoint API non valido" nelle impostazioni

Assicurati che l'endpoint inizi con `https://` (o `http://` per Ollama locale)
ed è un URL completo. Utilizza **Riempimento predefinito** per ripristinare il valore consigliato.

## Errori 401/403

- Ricontrolla la chiave API nelle impostazioni.
- Conferma che la chiave sia attiva nella console del provider.
- Alcuni fornitori richiedono che la fatturazione sia abilitata prima di poter utilizzare le chiavi.

## Limiti di frequenza o errori di quota

I fornitori possono limitare o bloccare le richieste se superi i limiti del piano.
Riprova più tardi o aggiorna il piano del tuo provider.

## Impossibile caricare i modelli Ollama

- Conferma che Ollama è in esecuzione: `ollama serve`.
- Imposta `OLLAMA_ORIGINS="*"` e riavvia per consentire le richieste di estensione.
- Utilizza l'endpoint predefinito `http://localhost:11434`.

## La traduzione dell'intera pagina sembra interrotta

La traduzione a pagina intera è sperimentale. Se il layout di una pagina si interrompe, ricarica la scheda
per ripristinare il contenuto originale e provare a tradurre una selezione più piccola.

## L'estensione non risponde

- Ricarica l'estensione in `chrome://extensions/` o `about:debugging`.
- Riapri la pagina **Opzioni** e assicurati che le impostazioni siano salvate.
