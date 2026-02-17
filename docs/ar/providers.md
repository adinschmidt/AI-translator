# الموفرون ومفاتيح واجهة برمجة التطبيقات

<a id="general-setup"></a>

AI Translator يدعم العديد من موفري الذكاء الاصطناعي. في الوضع **الأساسي**، اختر من بين
OpenAI وAnthropic وGoogle. في الوضع **المتقدم**، يمكنك تكوين كل شيء
مقدمي الخدمات وتخصيص نقاط النهاية والنماذج.

## الإعداد العام

1. قم بإنشاء مفتاح API في وحدة تحكم الموفر.
2. افتح **خيارات** → حدد الموفر.
3. الصق المفتاح في الحقل **مفتاح API**.
4. (الوضع المتقدم) قم بتأكيد نقطة النهاية والنموذج.

## OpenAI

- أنشئ مفتاحًا: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- نقطة النهاية الافتراضية: `https://api.openai.com/v1/chat/completions`
- النموذج الافتراضي: `gpt-5-mini`

## Anthropic Claude

- قم بإنشاء مفتاح: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- نقطة النهاية الافتراضية: `https://api.anthropic.com/v1/messages`
- النموذج الافتراضي: `claude-haiku-4-5`

## Google Gemini

- أنشئ مفتاحًا: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- نقطة النهاية الافتراضية: `https://generativelanguage.googleapis.com/v1beta`
- النموذج الافتراضي: `gemini-3-flash-preview`

## Groq

- قم بإنشاء مفتاح: [console.groq.com/keys](https://console.groq.com/keys)
- نقطة النهاية الافتراضية: `https://api.groq.com/openai/v1/chat/completions`
- النموذج الافتراضي: `qwen/qwen3-32b`

## Grok (xAI)

- إنشاء مفتاح: [console.x.ai/api-keys](https://console.x.ai/api-keys)
- نقطة النهاية الافتراضية: `https://api.x.ai/v1/chat/completions`
- النموذج الافتراضي: `grok-3-mini`

## OpenRouter

- قم بإنشاء مفتاح: [openrouter.ai/keys](https://openrouter.ai/keys)
- نقطة النهاية الافتراضية: `https://openrouter.ai/api/v1/chat/completions`
- النموذج الافتراضي: `openrouter/auto`

## DeepSeek

- قم بإنشاء مفتاح: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- نقطة النهاية الافتراضية: `https://api.deepseek.com/v1/chat/completions`
- النموذج الافتراضي: `deepseek-chat`

## Mistral AI

- قم بإنشاء مفتاح: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- نقطة النهاية الافتراضية: `https://api.mistral.ai/v1/chat/completions`
- النموذج الافتراضي: `mistral-small-latest`

## Qwen (علي بابا داش سكوب)

- قم بإنشاء مفتاح: [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- نقطة النهاية الافتراضية: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- النموذج الافتراضي: `qwen-turbo`

## Cerebras

- إنشاء مفتاح: [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- نقطة النهاية الافتراضية: `https://api.cerebras.ai/v1/chat/completions`
- النموذج الافتراضي: `llama3.1-8b`
- الموديلات المتوفرة:
    - `llama3.1-8b` - الاستدلال السريع، الأمثل للسرعة
    - `gpt-oss-120b` - تفكير قوي في العلوم والرياضيات والبرمجة
    - `qwen-3-235b-a22b-instruct-2507` - نموذج تعليمات كبير
    - `zai-glm-4.7` - تفكير متقدم مع أداء برمجي قوي

## Ollama (محلي)

- تثبيت Ollama: [ollama.com/download](https://ollama.com/download)
- نقطة النهاية الافتراضية: `http://localhost:11434`
- النموذج الافتراضي: `llama3.2`
- مفتاح API: غير مطلوب

::: tip
بالنسبة لإضافات Chrome، قد يحتاج Ollama إلى السماح بالطلبات من أصول الإضافات.
قم بتشغيل `OLLAMA_ORIGINS="*" ollama serve` ثم انقر فوق **تحديث** في الإعدادات.
:::
