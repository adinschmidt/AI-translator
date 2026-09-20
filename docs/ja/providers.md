# プロバイダーと API キー

基本モードは OpenAI、Anthropic、Google、詳細モードは全 11 プロバイダーに対応します。プロバイダーを選びキーを入力してください。Ollama はキー不要です。設定は自動保存されます。

以下は組み込みの既定値で、利用可能性を保証しません。モデルを更新するとカタログを取得し、失敗時は候補を表示します。カスタム ID も入力できます。既定値ボタンは対応する欄を戻します。キーとリクエストは設定したエンドポイントに送信します。

| プロバイダー | 既定のエンドポイント | 既定のモデル | キーまたはダウンロード |
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

OpenAI 互換サービスは Chat Completions を使用します。推論上書きは任意でモデルに依存します。拡張機能は出力トークン上限を設定しません。[設定](/ja/settings)を参照してください。

## Ollama

`ollama pull llama3.2` でモデルを取得し、Ollama を起動します。一覧は `/api/tags`、翻訳は `/v1` を使います。オリジンが拒否されたら `OLLAMA_ORIGINS` を設定して再起動します。`OLLAMA_ORIGINS="*" ollama serve` は全オリジンを許可するため、そのアクセスを意図する場合だけ使い、モデルを更新してください。
