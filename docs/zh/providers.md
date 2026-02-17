# 提供商和 API 密钥

<a id="general-setup"></a>

AI Translator 支持多个人工智能提供商。在**基本**模式下，选择
OpenAI、Anthropic 和 Google。在**高级**模式下，您可以配置所有
提供者并自定义端点和模型。

## 一般设置

1. 在提供商控制台中创建 API 密钥。
2. 打开**选项** → 选择提供商。
3. 将密钥粘贴到 **API 密钥** 字段中。
4.（高级模式）确认端点和模型。

## OpenAI

- 创建密钥：[platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- 默认端点：`https://api.openai.com/v1/chat/completions`
- 默认模型：`gpt-5-mini`

## Anthropic Claude

- 创建密钥：[console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- 默认端点：`https://api.anthropic.com/v1/messages`
- 默认模型：`claude-haiku-4-5`

## Google Gemini

- 创建密钥：[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- 默认端点：`https://generativelanguage.googleapis.com/v1beta`
- 默认模型：`gemini-3-flash-preview`

## Groq

- 创建密钥：[console.groq.com/keys](https://console.groq.com/keys)
- 默认端点：`https://api.groq.com/openai/v1/chat/completions`
- 默认模型：`qwen/qwen3-32b`

## Grok (xAI)

- 创建密钥：[console.x.ai/api-keys](https://console.x.ai/api-keys)
- 默认端点：`https://api.x.ai/v1/chat/completions`
- 默认模型：`grok-3-mini`

## OpenRouter

- 创建密钥：[openrouter.ai/keys](https://openrouter.ai/keys)
- 默认端点：`https://openrouter.ai/api/v1/chat/completions`
- 默认模型：`openrouter/auto`

## DeepSeek

- 创建密钥：[platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- 默认端点：`https://api.deepseek.com/v1/chat/completions`
- 默认模型：`deepseek-chat`

## Mistral AI

- 创建密钥：[console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- 默认端点：`https://api.mistral.ai/v1/chat/completions`
- 默认模型：`mistral-small-latest`

## Qwen (阿里巴巴 DashScope)

- 创建密钥：[dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- 默认端点：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- 默认模型：`qwen-turbo`

## Cerebras

- 创建密钥：[cloud.cerebras.ai](https://cloud.cerebras.ai/)
- 默认端点：`https://api.cerebras.ai/v1/chat/completions`
- 默认模型：`llama3.1-8b`
- 可用模型：
    - `llama3.1-8b` – 快速推理，速度优化
    - `gpt-oss-120b` – 跨科学、数学和编码的强大推理
    - `qwen-3-235b-a22b-instruct-2507` – 大型指令模型
    - `zai-glm-4.7` – 具有强大编码性能的高级推理

## Ollama（本地）

- 安装Ollama：[ollama.com/download](https://ollama.com/download)
- 默认端点：`http://localhost:11434`
- 默认模型：`llama3.2`
- API 密钥：不需要

::: tip
对于 Chrome 扩展程序，Ollama 可能需要允许来自扩展程序来源的请求。
运行`OLLAMA_ORIGINS="*" ollama serve`，然后单击设置中的**刷新**。
:::
