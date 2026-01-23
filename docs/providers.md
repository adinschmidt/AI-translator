# Providers & API Keys

AI Translator supports multiple AI providers. In **Basic** mode, choose between
OpenAI, Anthropic, and Google. In **Advanced** mode, you can configure all
providers and customize endpoints and models.

## General setup

1. Create an API key in the provider console.
2. Open **Options** → select the provider.
3. Paste the key into the **API Key** field.
4. (Advanced mode) Confirm the endpoint and model.

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
- Default model: `gemini-3-flash-preview`

## Groq

- Create a key: [console.groq.com/keys](https://console.groq.com/keys)
- Default endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Default model: `qwen/qwen3-32b`

## Grok (xAI)

- Create a key: [console.x.ai/api-keys](https://console.x.ai/api-keys)
- Default endpoint: `https://api.x.ai/v1/chat/completions`
- Default model: `grok-3-mini`

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
- Default model: `qwen-3-235b-a22b-instruct-2507`
- Available models:
  - `llama3.1-8b` – Fast inference, optimized for speed
  - `llama-3.3-70b` – Enhanced for coding, math, and reasoning
  - `qwen-3-32b` – Multilingual with hybrid reasoning
  - `qwen-3-235b-a22b-instruct-2507` – Large instruct model
  - `gpt-oss-120b` – Strong reasoning across science, math, and coding
  - `zai-glm-4.7` – Advanced reasoning with strong coding performance

## Ollama (Local)

- Install Ollama: [ollama.com/download](https://ollama.com/download)
- Default endpoint: `http://localhost:11434`
- Default model: `llama3.2`
- API key: not required

::: tip
For Chrome extensions, Ollama may need to allow requests from extension origins.
Run `OLLAMA_ORIGINS="*" ollama serve` and then click **Refresh** in settings.
:::
