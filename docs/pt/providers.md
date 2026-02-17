# Provedores e chaves de API

<a id="general-setup"></a>

AI Translator oferece suporte a vários provedores de IA. No modo **Básico**, escolha entre
OpenAI, Anthropic e Google. No modo **Avançado**, você pode configurar todos
provedores e personalizar endpoints e modelos.

## Configuração geral

1. Crie uma chave de API no console do provedor.
2. Abra **Opções** → selecione o provedor.
3. Cole a chave no campo **API Key**.
4. (Modo avançado) Confirme o endpoint e o modelo.

## OpenAI

- Crie uma chave: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Ponto de extremidade padrão: `https://api.openai.com/v1/chat/completions`
- Modelo padrão: `gpt-5-mini`

## Anthropic Claude

- Crie uma chave: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- Ponto de extremidade padrão: `https://api.anthropic.com/v1/messages`
- Modelo padrão: `claude-haiku-4-5`

## Google Gemini

- Crie uma chave: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Ponto de extremidade padrão: `https://generativelanguage.googleapis.com/v1beta`
- Modelo padrão: `gemini-3-flash-preview`

## Groq

- Crie uma chave: [console.groq.com/keys](https://console.groq.com/keys)
- Ponto de extremidade padrão: `https://api.groq.com/openai/v1/chat/completions`
- Modelo padrão: `qwen/qwen3-32b`

## Grok (xAI)

- Crie uma chave: [console.x.ai/api-keys](https://console.x.ai/api-keys)
- Ponto de extremidade padrão: `https://api.x.ai/v1/chat/completions`
- Modelo padrão: `grok-3-mini`

## OpenRouter

- Crie uma chave: [openrouter.ai/keys](https://openrouter.ai/keys)
- Ponto de extremidade padrão: `https://openrouter.ai/api/v1/chat/completions`
- Modelo padrão: `openrouter/auto`

## DeepSeek

- Crie uma chave: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- Ponto de extremidade padrão: `https://api.deepseek.com/v1/chat/completions`
- Modelo padrão: `deepseek-chat`

## Mistral AI

- Crie uma chave: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- Ponto de extremidade padrão: `https://api.mistral.ai/v1/chat/completions`
- Modelo padrão: `mistral-small-latest`

## Qwen (Alibaba DashScope)

- Crie uma chave: [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- Ponto de extremidade padrão: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- Modelo padrão: `qwen-turbo`

## Cerebras

- Crie uma chave: [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- Ponto de extremidade padrão: `https://api.cerebras.ai/v1/chat/completions`
- Modelo padrão: `llama3.1-8b`
- Modelos disponíveis:
    - `llama3.1-8b` – Inferência rápida, otimizada para velocidade
    - `gpt-oss-120b` – Forte raciocínio em ciências, matemática e codificação
    - `qwen-3-235b-a22b-instruct-2507` – Modelo de instrução grande
    - `zai-glm-4.7` – Raciocínio avançado com forte desempenho de codificação

## Ollama (Local)

- Instale Ollama: [ollama.com/download](https://ollama.com/download)
- Ponto de extremidade padrão: `http://localhost:11434`
- Modelo padrão: `llama3.2`
- Chave API: não necessária

::: tip
Para extensões do Chrome, Ollama pode precisar permitir solicitações de origens de extensão.
Execute `OLLAMA_ORIGINS="*" ollama serve` e clique em **Atualizar** nas configurações.
:::
