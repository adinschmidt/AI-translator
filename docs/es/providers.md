# Proveedores y claves API

En modo básico puedes elegir OpenAI, Anthropic o Google. El modo avanzado ofrece los 11 proveedores. Selecciona uno e introduce su clave; Ollama no requiere clave. Los ajustes se guardan automáticamente.

Estos son valores integrados, no una garantía de disponibilidad. Actualiza los modelos para consultar el catálogo del proveedor; si falla, se muestran sugerencias. También puedes escribir un ID personalizado. Los botones de valores predeterminados restablecen su campo. Las claves y solicitudes se envían al endpoint configurado.

| Proveedor | Endpoint predeterminado | Modelo predeterminado | Clave o descarga |
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

Los servicios compatibles con OpenAI usan Chat Completions. El razonamiento es opcional y depende del modelo. La extensión no impone un límite de tokens de salida. Consulta [Ajustes](/es/settings).

## Ollama

Descarga un modelo con `ollama pull qwen3.5:4b` y ejecuta Ollama. La lista usa `/api/tags` y la traducción `/v1`. Si el origen se rechaza, configura `OLLAMA_ORIGINS` y reinicia. `OLLAMA_ORIGINS="*" ollama serve` permite todos los orígenes; úsalo solo si deseas ese acceso. Después actualiza los modelos.

## Valores para traducción

Los modelos recomendados usan razonamiento desactivado en OpenAI Luna, DeepSeek Flash, Qwen 3.8 Flash y Ollama Qwen; GPT-OSS en Groq/Cerebras y Grok 4.6 usan `low`. Anthropic, Google y otros modelos mantienen sus valores. Una anulación avanzada tiene prioridad. Grok 4.6 y GPT-OSS no admiten `none`.

OpenRouter automático tiene un techo de $1 por millón de tokens de entrada y $5 por millón de salida. No es un presupuesto por solicitud o mensual. Si no hay endpoint compatible, falla. Los modelos elegidos explícitamente no tienen este techo.

El modo básico usa los modelos actuales. El avanzado conserva tu selección; usa el botón de valor predeterminado para cambiarla. Instala `ollama pull qwen3.5:4b`, una descarga de unos 3,4 GB que necesita más memoria al ejecutarse. Estas recomendaciones se basan en catálogos, no en una evaluación comparativa de traducción.
