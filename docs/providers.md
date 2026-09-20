# Providers & API keys

AI Translator supports multiple AI providers. In **Basic** mode, choose between
OpenAI, Anthropic, and Google. In **Advanced** mode, you can configure all
providers and customize endpoints and models.

## General setup

1. Create an API key in the provider console.
2. Open **Options** → select the provider.
3. Paste the key into the **API Key** field.
4. In Advanced mode, confirm the endpoint and model. Settings save automatically.

The defaults below are built into the extension, not a guarantee of model availability. **Refresh Models** requests the current catalog; if discovery fails, built-in suggestions remain available. You can enter a custom model ID. Endpoint and model **Fill Default** buttons reset their respective fields.

OpenAI-compatible services use Chat Completions. The extension does not impose an output-token cap. Reasoning overrides are optional and depend on model support; see [Settings](/settings#override-reasoning).

## OpenAI

- Create a key: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Default endpoint: `https://api.openai.com/v1/chat/completions`
- Default model: `gpt-5-mini`

## Anthropic Claude

- Create a key: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- Default endpoint: `https://api.anthropic.com/v1/messages`
- Default model: `claude-haiku-4-5`

## Google Gemini

- Create a key: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Default endpoint: `https://generativelanguage.googleapis.com/v1beta`
- Default model: `gemini-flash-lite-latest`

## Groq

- Create a key: [console.groq.com/keys](https://console.groq.com/keys)
- Default endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Default model: `moonshotai/kimi-k2-instruct`

## Grok (xAI)

- Create a key: [console.x.ai/api-keys](https://console.x.ai/api-keys)
- Default endpoint: `https://api.x.ai/v1/chat/completions`
- Default model: `grok-4-1-fast-non-reasoning`

## OpenRouter

- Create a key: [openrouter.ai/keys](https://openrouter.ai/keys)
- Default endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Default model: `openrouter/auto`

## DeepSeek

- Create a key: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- Default endpoint: `https://api.deepseek.com/v1/chat/completions`
- Default model: `deepseek-chat`

## Mistral AI

- Create a key: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- Default endpoint: `https://api.mistral.ai/v1/chat/completions`
- Default model: `mistral-small-latest`

## Qwen (Alibaba DashScope)

- Create a key: [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- Default endpoint: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- Default model: `qwen-turbo`

## Cerebras

- Create a key: [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- Default endpoint: `https://api.cerebras.ai/v1/chat/completions`
- Default model: `llama3.1-8b`
- Built-in fallback suggestions:
    - `llama3.1-8b`
    - `gpt-oss-120b`
    - `qwen-3-235b-a22b-instruct-2507`
    - `zai-glm-4.7`

## Ollama (Local)

- Install Ollama: [ollama.com/download](https://ollama.com/download)
- Default endpoint: `http://localhost:11434`
- Default model: `llama3.2`
- API key: not required

::: tip
Download a model first, for example `ollama pull llama3.2`. Model discovery uses `/api/tags`; translation uses the OpenAI-compatible `/v1` API.

If Ollama rejects requests from your extension, configure `OLLAMA_ORIGINS` for that origin and restart Ollama. `OLLAMA_ORIGINS="*" ollama serve` permits all origins. Use that wildcard only if you intend to allow that access, then click **Refresh Models**.
:::
