# Поставщики и ключи API

<a id="general-setup"></a>

AI Translator поддерживает несколько поставщиков ИИ. В режиме **Основной** выберите между
OpenAI, Anthropic и Google. В **Расширенном** режиме вы можете настроить все
поставщиков и настраивать конечные точки и модели.

## Общие настройки

1. Создайте ключ API в консоли провайдера.
2. Откройте **Параметры** → выберите провайдера.
3. Вставьте ключ в поле **Ключ API**.
4. (Расширенный режим) Подтвердите конечную точку и модель.

## OpenAI

- Создайте ключ: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Конечная точка по умолчанию: `https://api.openai.com/v1/chat/completions`.
- Модель по умолчанию: `gpt-5-mini`

## Anthropic Claude

- Создайте ключ: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- Конечная точка по умолчанию: `https://api.anthropic.com/v1/messages`.
- Модель по умолчанию: `claude-haiku-4-5`

## Google Gemini

- Создайте ключ: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Конечная точка по умолчанию: `https://generativelanguage.googleapis.com/v1beta`.
- Модель по умолчанию: `gemini-3-flash-preview`

## Groq

- Создайте ключ: [console.groq.com/keys](https://console.groq.com/keys)
- Конечная точка по умолчанию: `https://api.groq.com/openai/v1/chat/completions`.
- Модель по умолчанию: `qwen/qwen3-32b`

## Grok (xAI)

- Создайте ключ: [console.x.ai/api-keys](https://console.x.ai/api-keys)
- Конечная точка по умолчанию: `https://api.x.ai/v1/chat/completions`.
- Модель по умолчанию: `grok-3-mini`

## OpenRouter

- Создайте ключ: [openrouter.ai/keys](https://openrouter.ai/keys)
- Конечная точка по умолчанию: `https://openrouter.ai/api/v1/chat/completions`.
- Модель по умолчанию: `openrouter/auto`

## DeepSeek

- Создайте ключ: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- Конечная точка по умолчанию: `https://api.deepseek.com/v1/chat/completions`.
- Модель по умолчанию: `deepseek-chat`

## Mistral AI

- Создайте ключ: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- Конечная точка по умолчанию: `https://api.mistral.ai/v1/chat/completions`.
- Модель по умолчанию: `mistral-small-latest`

## Qwen (Alibaba DashScope)

- Создайте ключ: [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- Конечная точка по умолчанию: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`.
- Модель по умолчанию: `qwen-turbo`

## Cerebras

- Создайте ключ: [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- Конечная точка по умолчанию: `https://api.cerebras.ai/v1/chat/completions`.
- Модель по умолчанию: `llama3.1-8b`
- Доступные модели:
    - `llama3.1-8b` – Быстрый вывод, оптимизированный по скорости
    - `gpt-oss-120b` – Сильная аргументация в области естественных наук, математики и программирования.
    - `qwen-3-235b-a22b-instruct-2507` – Большая модель инструкций
    - `zai-glm-4.7` – Продвинутые рассуждения с высокой производительностью кодирования.

## Ollama (локальный)

- Установите Ollama: [ollama.com/download](https://ollama.com/download)
- Конечная точка по умолчанию: `http://localhost:11434`.
- Модель по умолчанию: `llama3.2`
- Ключ API: не требуется

::: tip
Для расширений Chrome Ollama может потребоваться разрешить запросы от источников расширений.
Запустите `OLLAMA_ORIGINS="*" ollama serve` и нажмите **Обновить** в настройках.
:::
