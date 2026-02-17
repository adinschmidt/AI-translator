# Informativa sulla privacy per AI Translator

**Ultimo aggiornamento:** 10 gennaio 2026

## 1. Panoramica

AI Translator ("noi", "nostro" o "l'estensione") è un'estensione del browser lato client
che consente agli utenti di tradurre il testo utilizzando le proprie chiavi API AI. L'estensione
funziona interamente all'interno del tuo browser e non trasmette dati ad alcun server
posseduto o gestito dallo sviluppatore.

**Questa non è una consulenza legale.** Questa politica descrive come viene gestita l'estensione
dati per aiutarti a prendere una decisione informata sul suo utilizzo.

## 2. Raccolta e archiviazione dei dati

- **Dati personali:** Noi (lo sviluppatore) non raccogliamo, archiviamo o non abbiamo accesso
  qualsiasi dato personale, testo tradotto o cronologia di navigazione.
- **Chiavi API:** le tue chiavi API vengono archiviate esclusivamente sul tuo dispositivo utilizzando
  spazio di archiviazione sincronizzato del browser (`browser.storage.sync`). Questo significa il tuo
  le impostazioni si sincronizzano tra i tuoi browser quando accedi, ma non lo sono mai
  trasmesso allo sviluppatore o a terze parti diverse dall'IA specifica
  fornitore scelto per le richieste di traduzione.
- **Nessun server backend:** questa estensione non gestisce un server backend. Tutto
  l'elaborazione avviene localmente nel tuo browser.

## 3. Condivisione dei dati con terze parti

Per funzionare, questa estensione invia il testo selezionato esplicitamente per la traduzione
direttamente dal tuo browser al provider AI che hai configurato. Utilizzando
questa estensione, riconosci che i tuoi dati sono soggetti alla privacy
politiche di questi fornitori:

| Fornitore            | Informativa sulla privacy                                                          |
| -------------------- | ---------------------------------------------------------------------------------- |
| **OpenAI**           | [https://openai.com/privacy](https://openai.com/privacy)                           |
| **Anthropic**        | [https://www.anthropic.com/legal/privacy](https://www.anthropic.com/legal/privacy) |
| **Google (Gemini)** | [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)   |
| **xAI (Grok)**       | [https://x.ai/legal/privacy-policy](https://x.ai/legal/privacy-policy)             |
| **OpenRouter**       | [https://openrouter.ai/privacy](https://openrouter.ai/privacy)                     |
| **Ollama (Locale)**  | I dati rimangono sul tuo computer locale; nessuna trasmissione esterna.            |

**Considerazioni importanti:**

- Alcuni fornitori potrebbero utilizzare i tuoi dati per addestrare i loro modelli a meno che tu non decida di disattivarli
  (controlla la politica di ciascun fornitore).
- OpenRouter instrada le richieste a vari fornitori di intelligenza artificiale sottostanti, ciascuno con il proprio
  proprie politiche sui dati.
- Non vendiamo, scambiamo o trasferiamo in altro modo i tuoi dati a soggetti esterni.

## 4. Politiche dello store del browser

Se distribuita tramite negozi di estensioni del browser, questa estensione aderisce a
policy sui dati utente applicabili, tra cui [Chrome Web Store Policy sui dati utente](https://developer.chrome.com/docs/webstore/program-policies/) e [Policy sui componenti aggiuntivi di Firefox](https://extensionworkshop.com/documentation/publish/add-on-policies/).

## 5. Spiegazione delle autorizzazioni

Questa estensione richiede le seguenti autorizzazioni:

| Autorizzazione                    | Scopo                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `contextMenus`                    | Aggiunge l'opzione "Traduci" al menu contestuale                                                                                  |
| `scripting`                       | Inserisce la sovrapposizione dell'interfaccia utente di traduzione nelle pagine Web                                               |
| `storage`                         | Salva le chiavi API e le preferenze localmente                                                                                    |
| `host_permissions` (`<all_urls>`) | Necessario per visualizzare le traduzioni su qualsiasi pagina Web visitata e per effettuare chiamate API al provider AI prescelto |

## 6. Controllo utente

- **Cancellazione:** puoi rimuovere tutti i dati memorizzati da questa estensione disinstallandola
  l'estensione o cancellando i dati dell'estensione del browser.

- **Disattivazione:** nessun dato viene inviato ai fornitori di intelligenza artificiale a meno che tu non attivi esplicitamente a
  azione di traduzione.
- **Scelta del provider:** controlli tramite quale provider di intelligenza artificiale ricevere i tuoi dati
  selezionandolo nelle impostazioni dell'estensione.

## 7. Sicurezza

- Le chiavi API vengono archiviate nella memoria sicura del browser e vengono solo trasmesse
  tramite HTTPS agli endpoint del provider AI.
- L'estensione non registra, memorizza nella cache o conserva alcun testo tradotto successivamente
  visualizzandolo.

## 8. Modifiche a questa politica

Potremmo aggiornare la presente informativa sulla privacy di tanto in tanto. Le modifiche verranno riflesse
nella data "Ultimo aggiornamento" nella parte superiore di questo documento.

## 9. Contatto

Se hai domande su questa politica, apri un problema sul
[GitHub archivio](https://github.com/adinschmidt/AI-translator/issues).

---

_Questa estensione è open source. Puoi rivedere il codice per verificare la privacy
affermazioni._
