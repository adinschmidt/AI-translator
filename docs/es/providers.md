# Proveedores y claves API

En modo básico puedes elegir OpenAI, Anthropic o Google. El modo avanzado ofrece los 11 proveedores. Selecciona uno e introduce su clave; Ollama no requiere clave. Los ajustes se guardan automáticamente.

Estos son valores integrados, no una garantía de disponibilidad. Actualiza los modelos para consultar el catálogo del proveedor; si falla, se muestran sugerencias. También puedes escribir un ID personalizado. Los botones de valores predeterminados restablecen su campo. Las claves y solicitudes se envían al endpoint configurado.

| Proveedor | Endpoint predeterminado | Modelo predeterminado | Clave o descarga |
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

Los servicios compatibles con OpenAI usan Chat Completions. El razonamiento es opcional y depende del modelo. La extensión no impone un límite de tokens de salida. Consulta [Ajustes](/es/settings).

## Ollama

Descarga un modelo con `ollama pull llama3.2` y ejecuta Ollama. La lista usa `/api/tags` y la traducción `/v1`. Si el origen se rechaza, configura `OLLAMA_ORIGINS` y reinicia. `OLLAMA_ORIGINS="*" ollama serve` permite todos los orígenes; úsalo solo si deseas ese acceso. Después actualiza los modelos.
