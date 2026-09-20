# 提供商和 API 密钥

基本模式提供 OpenAI、Anthropic 和 Google，高级模式支持全部 11 个提供商。选择提供商并输入密钥；Ollama 无需密钥。设置自动保存。

以下是内置默认值，不保证模型当前可用。刷新模型可获取提供商目录，失败时显示内置建议。也可以输入自定义 ID。默认值按钮只恢复对应字段。密钥和请求会发送到配置的端点。

| 提供商 | 默认端点 | 默认模型 | 密钥或下载 |
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

OpenAI 兼容服务使用 Chat Completions。推理覆盖是可选设置，支持情况取决于模型。扩展不设置输出 token 上限。详见[设置](/zh/settings)。

## Ollama

运行 `ollama pull qwen3.5:4b` 下载模型并启动 Ollama。模型列表使用 `/api/tags`，翻译使用 `/v1`。来源被拒绝时设置 `OLLAMA_ORIGINS` 并重启。`OLLAMA_ORIGINS="*" ollama serve` 允许所有来源，只在确实需要该权限时使用，然后刷新模型。

## 翻译默认设置

推荐模型中，OpenAI Luna、DeepSeek Flash、Qwen 3.8 Flash 和 Ollama Qwen 默认关闭思考；Groq/Cerebras 的 GPT-OSS 和 Grok 4.6 使用 `low`。Anthropic、Google 及其他模型保留提供商默认值。明确的高级覆盖设置优先。Grok 4.6 和 GPT-OSS 不支持 `none`。

OpenRouter 自动路由的价格上限为每百万输入 token 1 美元、每百万输出 token 5 美元。这不是单次请求或月度预算。没有符合条件的端点时，请求会失败。明确选择的模型不受该上限限制。

基本模式使用当前推荐模型，高级模式保留已有选择，可通过默认值按钮切换。运行 `ollama pull qwen3.5:4b` 下载约 3.4 GB 的模型，运行时需要更多内存。这些推荐基于模型目录，并非翻译基准排名。
