# Provedores e chaves de API

O modo básico oferece OpenAI, Anthropic e Google. O avançado oferece os 11 fornecedores. Selecione um e introduza a chave; Ollama não exige chave. As definições são guardadas automaticamente.

Estes valores integrados não garantem disponibilidade. Atualize os modelos para consultar o catálogo; se falhar, aparecem sugestões. Pode escrever um ID personalizado. Os botões predefinidos repõem o respetivo campo. Chaves e pedidos vão para o endpoint configurado.

| Fornecedor | Endpoint predefinido | Modelo predefinido | Chave ou transferência |
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

Serviços compatíveis com OpenAI usam Chat Completions. O raciocínio é opcional e depende do modelo. A extensão não impõe um limite de tokens de saída. Consulte [Definições](/pt/settings).

## Ollama

Transfira um modelo com `ollama pull llama3.2` e inicie Ollama. A lista usa `/api/tags`, a tradução `/v1`. Se a origem for recusada, configure `OLLAMA_ORIGINS` e reinicie. `OLLAMA_ORIGINS="*" ollama serve` permite todas as origens; use apenas se pretende esse acesso. Depois atualize os modelos.
