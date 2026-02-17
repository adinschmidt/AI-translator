# Anbieter und API-Schlüssel

<a id="general-setup"></a>

AI Translator unterstützt mehrere KI-Anbieter. Wählen Sie im **Basic**-Modus zwischen
OpenAI, Anthropic und Google. Im **Erweiterten** Modus können Sie alles konfigurieren
Anbieter und passen Endpunkte und Modelle an.

## Allgemeine Einrichtung

1. Erstellen Sie einen API-Schlüssel in der Anbieterkonsole.
2. Öffnen Sie **Optionen** → wählen Sie den Anbieter aus.
3. Fügen Sie den Schlüssel in das Feld **API-Schlüssel** ein.
4. (Erweiterter Modus) Bestätigen Sie den Endpunkt und das Modell.

## OpenAI

- Erstellen Sie einen Schlüssel: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Standardendpunkt: `https://api.openai.com/v1/chat/completions`
- Standardmodell: `gpt-5-mini`

## Anthropic Claude

– Erstellen Sie einen Schlüssel: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

- Standardendpunkt: `https://api.anthropic.com/v1/messages`
- Standardmodell: `claude-haiku-4-5`

## Google Gemini

- Erstellen Sie einen Schlüssel: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Standardendpunkt: `https://generativelanguage.googleapis.com/v1beta`
- Standardmodell: `gemini-3-flash-preview`

## Groq

– Erstellen Sie einen Schlüssel: [console.groq.com/keys](https://console.groq.com/keys)

- Standardendpunkt: `https://api.groq.com/openai/v1/chat/completions`
- Standardmodell: `qwen/qwen3-32b`

## Grok (xAI)

– Erstellen Sie einen Schlüssel: [console.x.ai/api-keys](https://console.x.ai/api-keys)

- Standardendpunkt: `https://api.x.ai/v1/chat/completions`
- Standardmodell: `grok-3-mini`

## OpenRouter

- Erstellen Sie einen Schlüssel: [openrouter.ai/keys](https://openrouter.ai/keys)
- Standardendpunkt: `https://openrouter.ai/api/v1/chat/completions`
- Standardmodell: `openrouter/auto`

## DeepSeek

- Erstellen Sie einen Schlüssel: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- Standardendpunkt: `https://api.deepseek.com/v1/chat/completions`
- Standardmodell: `deepseek-chat`

## Mistral AI

– Erstellen Sie einen Schlüssel: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)

- Standardendpunkt: `https://api.mistral.ai/v1/chat/completions`
- Standardmodell: `mistral-small-latest`

## Qwen (Alibaba DashScope)

- Erstellen Sie einen Schlüssel: [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- Standardendpunkt: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- Standardmodell: `qwen-turbo`

## Cerebras

- Erstellen Sie einen Schlüssel: [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- Standardendpunkt: `https://api.cerebras.ai/v1/chat/completions`
- Standardmodell: `llama3.1-8b`
- Verfügbare Modelle:
    - `llama3.1-8b` – Schnelle Inferenz, optimiert für Geschwindigkeit
    - `gpt-oss-120b` – Starkes Denken in Naturwissenschaften, Mathematik und Programmieren
    - `qwen-3-235b-a22b-instruct-2507` – Großes Instruktionsmodell
    - `zai-glm-4.7` – Fortgeschrittenes Denken mit starker Codierungsleistung

## Ollama (Lokal)

- Installieren Sie Ollama: [ollama.com/download](https://ollama.com/download)
- Standardendpunkt: `http://localhost:11434`
- Standardmodell: `llama3.2`
- API-Schlüssel: nicht erforderlich

::: tip
Für Chrome-Erweiterungen muss Ollama möglicherweise Anfragen von Erweiterungsursprüngen zulassen.
Führen Sie `OLLAMA_ORIGINS="*" ollama serve` aus und klicken Sie dann in den Einstellungen auf **Aktualisieren**.
:::
