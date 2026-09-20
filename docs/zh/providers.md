# 提供商和 API 密钥

基本模式提供 OpenAI、Anthropic 和 Google，高级模式支持全部 11 个提供商。选择提供商并输入密钥；Ollama 无需密钥。设置自动保存。

以下是内置默认值，不保证模型当前可用。刷新模型可获取提供商目录，失败时显示内置建议。也可以输入自定义 ID。默认值按钮只恢复对应字段。密钥和请求会发送到配置的端点。

| 提供商 | 默认端点 | 默认模型 | 密钥或下载 |
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

OpenAI 兼容服务使用 Chat Completions。推理覆盖是可选设置，支持情况取决于模型。扩展不设置输出 token 上限。详见[设置](/zh/settings)。

## Ollama

运行 `ollama pull llama3.2` 下载模型并启动 Ollama。模型列表使用 `/api/tags`，翻译使用 `/v1`。来源被拒绝时设置 `OLLAMA_ORIGINS` 并重启。`OLLAMA_ORIGINS="*" ollama serve` 允许所有来源，只在确实需要该权限时使用，然后刷新模型。
