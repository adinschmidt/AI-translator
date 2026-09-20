# प्रदाता और एपीआई कुंजी

बेसिक मोड में OpenAI, Anthropic और Google हैं। एडवांस्ड मोड में सभी 11 प्रदाता हैं। प्रदाता चुनकर कुंजी डालें; Ollama को कुंजी नहीं चाहिए। सेटिंग्स अपने आप सेव होती हैं।

ये अंतर्निहित मान हैं, उपलब्धता की गारंटी नहीं। सूची के लिए मॉडल रिफ़्रेश करें; विफल होने पर सुझाव दिखते हैं। कस्टम ID भी लिख सकते हैं। डिफ़ॉल्ट बटन संबंधित फ़ील्ड लौटाता है। कुंजियाँ और अनुरोध चुने एंडपॉइंट को भेजे जाते हैं।

| प्रदाता | डिफ़ॉल्ट एंडपॉइंट | डिफ़ॉल्ट मॉडल | कुंजी या डाउनलोड |
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

OpenAI-संगत सेवाएँ Chat Completions इस्तेमाल करती हैं। रीजनिंग ओवरराइड वैकल्पिक है और मॉडल पर निर्भर है। एक्सटेंशन आउटपुट टोकन सीमा नहीं लगाता। [सेटिंग्स](/hi/settings) देखें।

## Ollama

`ollama pull qwen3.5:4b` से मॉडल डाउनलोड करके Ollama चलाएँ। सूची `/api/tags` और अनुवाद `/v1` इस्तेमाल करते हैं। ओरिजिन अस्वीकार हो तो `OLLAMA_ORIGINS` सेट करके पुनः शुरू करें। `OLLAMA_ORIGINS="*" ollama serve` सभी ओरिजिन की अनुमति देता है; यह पहुँच चाहिए तभी इस्तेमाल करें, फिर मॉडल रिफ़्रेश करें.

## अनुवाद के डिफ़ॉल्ट

सुझाए मॉडल में OpenAI Luna, DeepSeek Flash, Qwen 3.8 Flash और Ollama Qwen की सोच बंद रहती है। Groq/Cerebras के GPT-OSS और Grok 4.6 में `low` इस्तेमाल होता है। Anthropic, Google और बाकी मॉडल अपने डिफ़ॉल्ट रखते हैं। स्पष्ट एडवांस्ड ओवरराइड को प्राथमिकता मिलती है। Grok 4.6 और GPT-OSS में `none` समर्थित नहीं है।

OpenRouter ऑटो राउटिंग की सीमा प्रति दस लाख इनपुट टोकन 1 USD और आउटपुट टोकन 5 USD है। यह प्रति अनुरोध या मासिक बजट नहीं है। योग्य एंडपॉइंट न हो तो अनुरोध विफल होता है। सीधे चुने मॉडल पर यह सीमा नहीं लगती।

बेसिक मोड वर्तमान मॉडल इस्तेमाल करता है। एडवांस्ड मोड आपका सेव किया चुनाव रखता है; बदलने के लिए डिफ़ॉल्ट बटन दबाएँ। `ollama pull qwen3.5:4b` से लगभग 3.4 GB डाउनलोड करें; चलाने में अधिक मेमोरी चाहिए। ये चुनाव कैटलॉग पर आधारित हैं, अनुवाद बेंचमार्क रैंकिंग पर नहीं।
