# Impostazioni

Apri il menu dell'estensione e fai clic su **Opzioni** per configurare AI Translator.

## Modalità

### Modalità base

- Scegli un fornitore (OpenAI, Anthropic o Google).
- Inserisci una chiave API.
- Seleziona la lingua di destinazione.
- L'estensione utilizza automaticamente gli endpoint e i modelli consigliati.

### Modalità avanzata

- Seleziona tra tutti i provider supportati.
- Personalizza l'endpoint API, il nome del modello e le istruzioni di traduzione.
- Ideale per configurazioni self-hosted, compatibili con OpenAI o per utenti esperti.

## Istruzioni per la traduzione

Utilizza le **Istruzioni di traduzione** per controllare il tono e lo stile. Il testo selezionato è
aggiunto automaticamente. Esempio:

```
Translate to Spanish. Keep the tone friendly and concise.
```

## Endpoint e modello API

Ogni provider dispone di un'opzione **Riempimento predefinito** che ripristina i valori consigliati
endpoint e nome del modello. Se necessario, puoi sovrascriverli entrambi in modalità Avanzata.

## Archiviazione e privacy

Le impostazioni vengono archiviate in `chrome.storage.sync` in modo che persistano su tutti i dispositivi.
Le chiavi API non vengono mai registrate sulla console.
