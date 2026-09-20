# Поставщики и ключи API

Базовый режим предлагает OpenAI, Anthropic и Google. Расширенный предлагает все 11 провайдеров. Выберите провайдера и введите ключ; Ollama не требует ключа. Настройки сохраняются автоматически.

Встроенные значения не гарантируют доступность. Обновите модели для запроса каталога; при ошибке появятся подсказки. Можно ввести свой ID. Кнопки стандартных значений сбрасывают соответствующее поле. Ключи и запросы отправляются на настроенный endpoint.

| Провайдер | Стандартный endpoint | Стандартная модель | Ключ или загрузка |
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

Совместимые с OpenAI сервисы используют Chat Completions. Рассуждения необязательны и зависят от модели. Расширение не задаёт лимит выходных токенов. См. [Настройки](/ru/settings).

## Ollama

Загрузите модель через `ollama pull qwen3.5:4b` и запустите Ollama. Список использует `/api/tags`, перевод `/v1`. Если источник отклонён, настройте `OLLAMA_ORIGINS` и перезапустите. `OLLAMA_ORIGINS="*" ollama serve` разрешает все источники; используйте только если такой доступ нужен. Затем обновите модели.

## Настройки перевода

Рекомендуемые модели отключают рассуждения для OpenAI Luna, DeepSeek Flash, Qwen 3.8 Flash и Ollama Qwen. GPT-OSS на Groq/Cerebras и Grok 4.6 используют `low`. Anthropic, Google и другие модели сохраняют свои настройки. Явное расширенное переопределение имеет приоритет. Grok 4.6 и GPT-OSS не поддерживают `none`.

Автоматический OpenRouter ограничен ценой 1 USD за миллион входных токенов и 5 USD за миллион выходных. Это не бюджет запроса или месяца. Если подходящих endpoints нет, запрос завершится ошибкой. Явно выбранные модели не ограничены этим порогом.

Базовый режим использует текущие модели. Расширенный сохраняет ваш выбор; восстановите стандартное значение поля для смены модели. Установите `ollama pull qwen3.5:4b`: загрузка около 3,4 ГБ, для работы нужно больше памяти. Выбор основан на каталогах, а не на измеренном сравнении переводов.
