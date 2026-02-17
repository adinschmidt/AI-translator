# Provider e chiavi API

<a id="general-setup"></a>

AI Translator supporta più fornitori di IA. Nella modalità **Base**, scegli tra
OpenAI, Anthropic e Google. Nella modalità **Avanzata** è possibile configurare tutto
provider e personalizzare endpoint e modelli.

## Configurazione generale

1. Crea una chiave API nella console del provider.
2. Apri **Opzioni** → seleziona il provider.
3. Incolla la chiave nel campo **Chiave API**.
4. (Modalità avanzata) Confermare l'endpoint e il modello.

## OpenAI

- Crea una chiave: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Endpoint predefinito: `https://api.openai.com/v1/chat/completions`
- Modello predefinito: `gpt-5-mini`

## Anthropic Claude

- Crea una chiave: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- Endpoint predefinito: `https://api.anthropic.com/v1/messages`
- Modello predefinito: `claude-haiku-4-5`

## Google Gemini

- Crea una chiave: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Endpoint predefinito: `https://generativelanguage.googleapis.com/v1beta`
- Modello predefinito: `gemini-3-flash-preview`

## Groq

- Crea una chiave: [console.groq.com/keys](https://console.groq.com/keys)
- Endpoint predefinito: `https://api.groq.com/openai/v1/chat/completions`
- Modello predefinito: `qwen/qwen3-32b`

## Grok (xAI)

- Crea una chiave: [console.x.ai/api-keys](https://console.x.ai/api-keys)
- Endpoint predefinito: `https://api.x.ai/v1/chat/completions`
- Modello predefinito: `grok-3-mini`

## OpenRouter

- Crea una chiave: [openrouter.ai/keys](https://openrouter.ai/keys)
- Endpoint predefinito: `https://openrouter.ai/api/v1/chat/completions`
- Modello predefinito: `openrouter/auto`

## DeepSeek

- Crea una chiave: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- Endpoint predefinito: `https://api.deepseek.com/v1/chat/completions`
- Modello predefinito: `deepseek-chat`

## Mistral AI

- Crea una chiave: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- Endpoint predefinito: `https://api.mistral.ai/v1/chat/completions`
- Modello predefinito: `mistral-small-latest`

## Qwen (Alibaba DashScope)

- Crea una chiave: [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- Endpoint predefinito: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- Modello predefinito: `qwen-turbo`

## Cerebras

- Crea una chiave: [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- Endpoint predefinito: `https://api.cerebras.ai/v1/chat/completions`
- Modello predefinito: `llama3.1-8b`
- Modelli disponibili:
    - `llama3.1-8b` – Inferenza veloce, ottimizzata per la velocità
    - `gpt-oss-120b` – Ragionamento forte in scienze, matematica e programmazione
    - `qwen-3-235b-a22b-instruct-2507` – Modello con istruzioni di grandi dimensioni
    - `zai-glm-4.7` – Ragionamento avanzato con ottime prestazioni di codifica

## Ollama (Locale)

- Installa Ollama: [ollama.com/download](https://ollama.com/download)
- Endpoint predefinito: `http://localhost:11434`
- Modello predefinito: `llama3.2`
- Chiave API: non richiesta

::: tip
Per le estensioni di Chrome, potrebbe essere necessario che Ollama consenta le richieste dalle origini delle estensioni.
Esegui `OLLAMA_ORIGINS="*" ollama serve` e quindi fai clic su **Aggiorna** nelle impostazioni.
:::
