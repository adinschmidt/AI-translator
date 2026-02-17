# प्रदाता और एपीआई कुंजी

<a id="general-setup"></a>

AI Translator अनेक AI प्रदाताओं का समर्थन करता है। **बेसिक** मोड में, इनमें से चुनें
OpenAI, Anthropic, और Google। **उन्नत** मोड में, आप सभी को कॉन्फ़िगर कर सकते हैं
प्रदाताओं और समापन बिंदुओं और मॉडलों को अनुकूलित करें।

## सामान्य सेटअप

1. प्रदाता कंसोल में एक एपीआई कुंजी बनाएं।
2. **विकल्प** खोलें → प्रदाता का चयन करें।
3. कुंजी को **एपीआई कुंजी** फ़ील्ड में चिपकाएँ।
4. (उन्नत मोड) समापन बिंदु और मॉडल की पुष्टि करें।

## OpenAI

- एक कुंजी बनाएं: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- डिफ़ॉल्ट समापन बिंदु: `https://api.openai.com/v1/chat/completions`
- डिफ़ॉल्ट मॉडल: `gpt-5-mini`

## Anthropic Claude

- एक कुंजी बनाएं: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- डिफ़ॉल्ट समापन बिंदु: `https://api.anthropic.com/v1/messages`
- डिफ़ॉल्ट मॉडल: `claude-haiku-4-5`

## Google Gemini

- एक कुंजी बनाएं: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- डिफ़ॉल्ट समापन बिंदु: `https://generativelanguage.googleapis.com/v1beta`
- डिफ़ॉल्ट मॉडल: `gemini-3-flash-preview`

## Groq

- एक कुंजी बनाएं: [console.groq.com/keys](https://console.groq.com/keys)
- डिफ़ॉल्ट समापन बिंदु: `https://api.groq.com/openai/v1/chat/completions`
- डिफ़ॉल्ट मॉडल: `qwen/qwen3-32b`

## Grok (xAI)

- एक कुंजी बनाएं: [console.x.ai/api-keys](https://console.x.ai/api-keys)
- डिफ़ॉल्ट समापन बिंदु: `https://api.x.ai/v1/chat/completions`
- डिफ़ॉल्ट मॉडल: `grok-3-mini`

## OpenRouter

- एक कुंजी बनाएं: [openrouter.ai/keys](https://openrouter.ai/keys)
- डिफ़ॉल्ट समापन बिंदु: `https://openrouter.ai/api/v1/chat/completions`
- डिफ़ॉल्ट मॉडल: `openrouter/auto`

## DeepSeek

- एक कुंजी बनाएं: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- डिफ़ॉल्ट समापन बिंदु: `https://api.deepseek.com/v1/chat/completions`
- डिफ़ॉल्ट मॉडल: `deepseek-chat`

## Mistral AI

- एक कुंजी बनाएं: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- डिफ़ॉल्ट समापन बिंदु: `https://api.mistral.ai/v1/chat/completions`
- डिफ़ॉल्ट मॉडल: `mistral-small-latest`

## Qwen (अलीबाबा डैशस्कोप)

- एक कुंजी बनाएं: [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- डिफ़ॉल्ट समापन बिंदु: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- डिफ़ॉल्ट मॉडल: `qwen-turbo`

## Cerebras

- एक कुंजी बनाएं: [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- डिफ़ॉल्ट समापन बिंदु: `https://api.cerebras.ai/v1/chat/completions`
- डिफ़ॉल्ट मॉडल: `llama3.1-8b`
- उपलब्ध मॉडल:
    - `llama3.1-8b` - तेज़ अनुमान, गति के लिए अनुकूलित
    - `gpt-oss-120b` - विज्ञान, गणित और कोडिंग में मजबूत तर्क
    - `qwen-3-235b-a22b-instruct-2507` - बड़ा निर्देश मॉडल
    - `zai-glm-4.7` - मजबूत कोडिंग प्रदर्शन के साथ उन्नत तर्क

## Ollama (स्थानीय)

- Ollama इंस्टॉल करें: [ollama.com/download](https://ollama.com/download)
- डिफ़ॉल्ट समापन बिंदु: `http://localhost:11434`
- डिफ़ॉल्ट मॉडल: `llama3.2`
- एपीआई कुंजी: आवश्यक नहीं

::: tip
Chrome एक्सटेंशन के लिए, Ollama को एक्सटेंशन मूल से अनुरोधों को अनुमति देने की आवश्यकता हो सकती है।
`OLLAMA_ORIGINS="*" ollama serve` चलाएँ और फिर सेटिंग्स में **रीफ्रेश** पर क्लिक करें।
:::
