# Provedores e chaves de API

O modo básico oferece OpenAI, Anthropic e Google. O avançado oferece os 11 fornecedores. Selecione um e introduza a chave; Ollama não exige chave. As definições são guardadas automaticamente.

Estes valores integrados não garantem disponibilidade. Atualize os modelos para consultar o catálogo; se falhar, aparecem sugestões. Pode escrever um ID personalizado. Os botões predefinidos repõem o respetivo campo. Chaves e pedidos vão para o endpoint configurado.

| Fornecedor | Endpoint predefinido | Modelo predefinido | Chave ou transferência |
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

Serviços compatíveis com OpenAI usam Chat Completions. O raciocínio é opcional e depende do modelo. A extensão não impõe um limite de tokens de saída. Consulte [Definições](/pt/settings).

## Ollama

Transfira um modelo com `ollama pull qwen3.5:4b` e inicie Ollama. A lista usa `/api/tags`, a tradução `/v1`. Se a origem for recusada, configure `OLLAMA_ORIGINS` e reinicie. `OLLAMA_ORIGINS="*" ollama serve` permite todas as origens; use apenas se pretende esse acesso. Depois atualize os modelos.

## Valores para tradução

Os modelos recomendados desativam o raciocínio em OpenAI Luna, DeepSeek Flash, Qwen 3.8 Flash e Ollama Qwen. GPT-OSS em Groq/Cerebras e Grok 4.6 usam `low`. Anthropic, Google e outros modelos mantêm os seus valores. Uma substituição avançada tem prioridade. Grok 4.6 e GPT-OSS não suportam `none`.

OpenRouter automático tem um teto de $1 por milhão de tokens de entrada e $5 de saída. Não é um orçamento por pedido nem mensal. Sem endpoint elegível, o pedido falha. Os modelos escolhidos explicitamente não têm este teto.

O modo básico usa modelos atuais. O avançado mantém a escolha guardada; reponha o campo predefinido para mudar. Instale `ollama pull qwen3.5:4b`: cerca de 3,4 GB de transferência, com maior uso de memória ao executar. Estas escolhas seguem catálogos, não comparações medidas de tradução.
