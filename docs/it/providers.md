# Provider e chiavi API

La modalità base offre OpenAI, Anthropic e Google. Quella avanzata offre tutti gli 11 fornitori. Scegline uno e inserisci la chiave; Ollama non la richiede. Le impostazioni si salvano automaticamente.

Questi valori integrati non garantiscono la disponibilità. Aggiorna i modelli per consultare il catalogo; in caso di errore compaiono suggerimenti. Puoi scrivere un ID personalizzato. I pulsanti predefiniti ripristinano il singolo campo. Chiavi e richieste vanno all'endpoint configurato.

| Fornitore | Endpoint predefinito | Modello predefinito | Chiave o download |
| --- | --- | --- | --- |
| OpenAI | `https://api.openai.com/v1/chat/completions` | `gpt-5-mini` | [OpenAI](https://platform.openai.com/api-keys) |
| Anthropic Claude | `https://api.anthropic.com/v1/messages` | `claude-haiku-4-5` | [Anthropic Claude](https://console.anthropic.com/settings/keys) |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | `gemini-flash-lite-latest` | [Google Gemini](https://aistudio.google.com/app/apikey) |
| Groq | `https://api.groq.com/openai/v1/chat/completions` | `moonshotai/kimi-k2-instruct` | [Groq](https://console.groq.com/keys) |
| Grok / xAI | `https://api.x.ai/v1/chat/completions` | `grok-4-1-fast-non-reasoning` | [Grok / xAI](https://console.x.ai/api-keys) |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | `openrouter/auto` | [OpenRouter](https://openrouter.ai/keys) |
| DeepSeek | `https://api.deepseek.com/v1/chat/completions` | `deepseek-chat` | [DeepSeek](https://platform.deepseek.com/api_keys) |
| Mistral AI | `https://api.mistral.ai/v1/chat/completions` | `mistral-small-latest` | [Mistral AI](https://console.mistral.ai/api-keys) |
| Qwen / Alibaba | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions` | `qwen-turbo` | [Qwen / Alibaba](https://dashscope.console.aliyun.com/apiKey) |
| Cerebras | `https://api.cerebras.ai/v1/chat/completions` | `llama3.1-8b` | [Cerebras](https://cloud.cerebras.ai/) |
| Ollama | `http://localhost:11434` | `llama3.2` | [Ollama](https://ollama.com/download) |

I servizi compatibili OpenAI usano Chat Completions. Il ragionamento è facoltativo e dipende dal modello. L'estensione non impone un limite ai token di uscita. Vedi [Impostazioni](/it/settings).

## Ollama

Scarica un modello con `ollama pull llama3.2` e avvia Ollama. La lista usa `/api/tags`, la traduzione `/v1`. Se l'origine viene rifiutata, configura `OLLAMA_ORIGINS` e riavvia. `OLLAMA_ORIGINS="*" ollama serve` consente tutte le origini; usalo solo se desideri questo accesso. Poi aggiorna i modelli.
