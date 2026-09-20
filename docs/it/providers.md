# Provider e chiavi API

La modalità base offre OpenAI, Anthropic e Google. Quella avanzata offre tutti gli 11 fornitori. Scegline uno e inserisci la chiave; Ollama non la richiede. Le impostazioni si salvano automaticamente.

Questi valori integrati non garantiscono la disponibilità. Aggiorna i modelli per consultare il catalogo; in caso di errore compaiono suggerimenti. Puoi scrivere un ID personalizzato. I pulsanti predefiniti ripristinano il singolo campo. Chiavi e richieste vanno all'endpoint configurato.

| Fornitore | Endpoint predefinito | Modello predefinito | Chiave o download |
| --- | --- | --- | --- |
| OpenAI | `https://api.openai.com/v1/chat/completions` | `gpt-5.6-luna` | [OpenAI](https://platform.openai.com/api-keys) |
| Anthropic Claude | `https://api.anthropic.com/v1/messages` | `claude-haiku-4-5` | [Anthropic Claude](https://console.anthropic.com/settings/keys) |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | `gemini-3.5-flash-lite` | [Google Gemini](https://aistudio.google.com/app/apikey) |
| Groq | `https://api.groq.com/openai/v1/chat/completions` | `openai/gpt-oss-120b` | [Groq](https://console.groq.com/keys) |
| Grok / xAI | `https://api.x.ai/v1/chat/completions` | `grok-4.6` | [Grok / xAI](https://console.x.ai/api-keys) |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | `openrouter/auto` | [OpenRouter](https://openrouter.ai/keys) |
| DeepSeek | `https://api.deepseek.com/v1/chat/completions` | `deepseek-flash` | [DeepSeek](https://platform.deepseek.com/api_keys) |
| Mistral AI | `https://api.mistral.ai/v1/chat/completions` | `mistral-small-latest` | [Mistral AI](https://console.mistral.ai/api-keys) |
| Qwen / Alibaba | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions` | `qwen3.8-flash` | [Qwen / Alibaba](https://dashscope.console.aliyun.com/apiKey) |
| Cerebras | `https://api.cerebras.ai/v1/chat/completions` | `gpt-oss-120b` | [Cerebras](https://cloud.cerebras.ai/) |
| Ollama | `http://localhost:11434` | `qwen3.5:4b` | [Ollama](https://ollama.com/download) |

I servizi compatibili OpenAI usano Chat Completions. Il ragionamento è facoltativo e dipende dal modello. L'estensione non impone un limite ai token di uscita. Vedi [Impostazioni](/it/settings).

## Ollama

Scarica un modello con `ollama pull qwen3.5:4b` e avvia Ollama. La lista usa `/api/tags`, la traduzione `/v1`. Se l'origine viene rifiutata, configura `OLLAMA_ORIGINS` e riavvia. `OLLAMA_ORIGINS="*" ollama serve` consente tutte le origini; usalo solo se desideri questo accesso. Poi aggiorna i modelli.

## Valori per la traduzione

I modelli consigliati disattivano il ragionamento per OpenAI Luna, DeepSeek Flash, Qwen 3.8 Flash e Ollama Qwen. GPT-OSS su Groq/Cerebras e Grok 4.6 usano `low`. Anthropic, Google e gli altri modelli mantengono i propri valori. Un override avanzato ha precedenza. Grok 4.6 e GPT-OSS non supportano `none`.

OpenRouter automatico ha un tetto di $1 per milione di token in ingresso e $5 in uscita. Non è un budget per richiesta o mensile. Senza endpoint idonei la richiesta fallisce. I modelli scelti esplicitamente non hanno questo tetto.

La modalità base usa i modelli attuali. Quella avanzata conserva la scelta salvata; ripristina il campo predefinito per cambiarla. Installa `ollama pull qwen3.5:4b`: circa 3,4 GB di download, con più memoria necessaria durante l'esecuzione. Queste scelte derivano dai cataloghi, non da confronti misurati della traduzione.
