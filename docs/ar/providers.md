# الموفرون ومفاتيح واجهة برمجة التطبيقات

يوفر الوضع الأساسي OpenAI وAnthropic وGoogle، والمتقدم جميع المزودين الأحد عشر. اختر مزودًا وأدخل مفتاحه؛ لا يحتاج Ollama إلى مفتاح. تُحفظ الإعدادات تلقائيًا.

هذه قيم مدمجة وليست ضمانًا لتوفر النماذج. حدّث النماذج لطلب القائمة؛ عند الفشل تظهر اقتراحات. يمكنك إدخال معرّف مخصص. تعيد أزرار القيم الافتراضية الحقل المقابل. تُرسل المفاتيح والطلبات إلى نقطة الاتصال المحددة.

| المزود | نقطة الاتصال الافتراضية | النموذج الافتراضي | المفتاح أو التنزيل |
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

تستخدم الخدمات المتوافقة مع OpenAI واجهة Chat Completions. تجاوز الاستدلال اختياري ويعتمد على النموذج. لا تضع الإضافة سقفًا لرموز الإخراج. راجع [الإعدادات](/ar/settings).

## Ollama

نزّل نموذجًا عبر `ollama pull qwen3.5:4b` وشغّل Ollama. تستخدم القائمة `/api/tags` والترجمة `/v1`. عند رفض المصدر اضبط `OLLAMA_ORIGINS` وأعد التشغيل. يسمح `OLLAMA_ORIGINS="*" ollama serve` بجميع المصادر؛ استخدمه فقط إذا أردت هذا الوصول، ثم حدّث النماذج.

## افتراضيات الترجمة

توقف النماذج الموصى بها التفكير في OpenAI Luna وDeepSeek Flash وQwen 3.8 Flash وOllama Qwen. يستخدم GPT-OSS على Groq/Cerebras وGrok 4.6 المستوى `low`. تحتفظ Anthropic وGoogle والنماذج الأخرى بافتراضياتها. يتقدم التجاوز المتقدم الصريح على هذه الإعدادات. لا يدعم Grok 4.6 وGPT-OSS القيمة `none`.

سقف OpenRouter التلقائي هو دولار واحد لكل مليون رمز إدخال و5 دولارات للإخراج. ليس ميزانية للطلب أو للشهر. يفشل الطلب عند غياب نقطة اتصال مؤهلة. لا يسري السقف على النماذج المختارة صراحة.

يستخدم الوضع الأساسي النماذج الحالية، ويحفظ المتقدم اختيارك؛ استخدم زر الافتراضي لتغييره. ثبّت `ollama pull qwen3.5:4b`، بتنزيل يقارب 3.4 GB ويحتاج ذاكرة أكبر للتشغيل. تستند الاختيارات إلى الكتالوجات لا إلى ترتيب اختبارات ترجمة.
