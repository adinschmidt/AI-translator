# Поставщики и ключи API

Базовый режим предлагает OpenAI, Anthropic и Google. Расширенный предлагает все 11 провайдеров. Выберите провайдера и введите ключ; Ollama не требует ключа. Настройки сохраняются автоматически.

Встроенные значения не гарантируют доступность. Обновите модели для запроса каталога; при ошибке появятся подсказки. Можно ввести свой ID. Кнопки стандартных значений сбрасывают соответствующее поле. Ключи и запросы отправляются на настроенный endpoint.

| Провайдер | Стандартный endpoint | Стандартная модель | Ключ или загрузка |
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

Совместимые с OpenAI сервисы используют Chat Completions. Рассуждения необязательны и зависят от модели. Расширение не задаёт лимит выходных токенов. См. [Настройки](/ru/settings).

## Ollama

Загрузите модель через `ollama pull llama3.2` и запустите Ollama. Список использует `/api/tags`, перевод `/v1`. Если источник отклонён, настройте `OLLAMA_ORIGINS` и перезапустите. `OLLAMA_ORIGINS="*" ollama serve` разрешает все источники; используйте только если такой доступ нужен. Затем обновите модели.
