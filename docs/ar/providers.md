# الموفرون ومفاتيح واجهة برمجة التطبيقات

يوفر الوضع الأساسي OpenAI وAnthropic وGoogle، والمتقدم جميع المزودين الأحد عشر. اختر مزودًا وأدخل مفتاحه؛ لا يحتاج Ollama إلى مفتاح. تُحفظ الإعدادات تلقائيًا.

هذه قيم مدمجة وليست ضمانًا لتوفر النماذج. حدّث النماذج لطلب القائمة؛ عند الفشل تظهر اقتراحات. يمكنك إدخال معرّف مخصص. تعيد أزرار القيم الافتراضية الحقل المقابل. تُرسل المفاتيح والطلبات إلى نقطة الاتصال المحددة.

| المزود | نقطة الاتصال الافتراضية | النموذج الافتراضي | المفتاح أو التنزيل |
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

تستخدم الخدمات المتوافقة مع OpenAI واجهة Chat Completions. تجاوز الاستدلال اختياري ويعتمد على النموذج. لا تضع الإضافة سقفًا لرموز الإخراج. راجع [الإعدادات](/ar/settings).

## Ollama

نزّل نموذجًا عبر `ollama pull llama3.2` وشغّل Ollama. تستخدم القائمة `/api/tags` والترجمة `/v1`. عند رفض المصدر اضبط `OLLAMA_ORIGINS` وأعد التشغيل. يسمح `OLLAMA_ORIGINS="*" ollama serve` بجميع المصادر؛ استخدمه فقط إذا أردت هذا الوصول، ثم حدّث النماذج.
