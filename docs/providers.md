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
- Default model: `gpt-5.6-luna`

## Anthropic Claude

- Create a key: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- Default endpoint: `https://api.anthropic.com/v1/messages`
- Default model: `claude-haiku-4-5`

## Google Gemini

- Create a key: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Default endpoint: `https://generativelanguage.googleapis.com/v1beta`
- Default model: `gemini-3.5-flash-lite`

## Groq

- Create a key: [console.groq.com/keys](https://console.groq.com/keys)
- Default endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Default model: `openai/gpt-oss-120b`

## Grok (xAI)

- Create a key: [console.x.ai/api-keys](https://console.x.ai/api-keys)
- Default endpoint: `https://api.x.ai/v1/chat/completions`
- Default model: `grok-4.6`

## OpenRouter

- Create a key: [openrouter.ai/keys](https://openrouter.ai/keys)
- Default endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Default model: `openrouter/auto`

## DeepSeek

- Create a key: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- Default endpoint: `https://api.deepseek.com/v1/chat/completions`
- Default model: `deepseek-flash`

## Mistral AI

- Create a key: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- Default endpoint: `https://api.mistral.ai/v1/chat/completions`
- Default model: `mistral-small-latest`

## Qwen (Alibaba DashScope)

- Create a key: [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- Default endpoint: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- Default model: `qwen3.8-flash`

## Cerebras

- Create a key: [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- Default endpoint: `https://api.cerebras.ai/v1/chat/completions`
- Default model: `gpt-oss-120b`
- Built-in fallback suggestions:
    - `gpt-oss-120b`
    - `qwen-3.8-27b`

## Ollama (Local)

- Install Ollama: [ollama.com/download](https://ollama.com/download)
- Default endpoint: `http://localhost:11434`
- Default model: `qwen3.5:4b`
- API key: not required

::: tip
Download a model first, for example `ollama pull qwen3.5:4b`. Model discovery uses `/api/tags`; translation uses the OpenAI-compatible `/v1` API.

If Ollama rejects requests from your extension, configure `OLLAMA_ORIGINS` for that origin and restart Ollama. `OLLAMA_ORIGINS="*" ollama serve` permits all origins. Use that wildcard only if you intend to allow that access, then click **Refresh Models**.
:::

## Translation defaults

Recommended models use economical reasoning settings when no Advanced override is enabled: `none` for OpenAI Luna and Ollama Qwen, thinking disabled for DeepSeek Flash and Qwen 3.8 Flash, and `low` for GPT-OSS on Groq/Cerebras and Grok 4.6. Other models retain provider defaults. Anthropic and Google retain their provider defaults. An explicit Advanced override takes precedence; Qwen Flash exposes on/off thinking rather than distinct effort levels. Grok 4.6 and GPT-OSS do not support `none`.

OpenRouter automatic routing is capped at **$1 per million input tokens and $5 per million output tokens**. This is a token-rate ceiling, not a per-request or monthly budget. If no eligible endpoint fits, the request fails. Explicit model selections have no extension-imposed price ceiling.

Basic mode uses the current built-in model and endpoint. Existing Advanced model selections remain saved; use **Fill Default** to switch to a new recommendation. Ollama users must install the new model with `ollama pull qwen3.5:4b`. Its download is about 3.4 GB and runtime memory requirements are higher.

These defaults follow provider catalogs checked on September 20, 2026. They are not a translation benchmark ranking. For cheaper alternatives, try `gemini-3.1-flash-lite`, Groq's `openai/gpt-oss-20b`, or `qwen3.7-flash`; check their reasoning settings and your provider's current prices.
