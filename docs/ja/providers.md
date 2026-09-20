# プロバイダーと API キー

基本モードは OpenAI、Anthropic、Google、詳細モードは全 11 プロバイダーに対応します。プロバイダーを選びキーを入力してください。Ollama はキー不要です。設定は自動保存されます。

以下は組み込みの既定値で、利用可能性を保証しません。モデルを更新するとカタログを取得し、失敗時は候補を表示します。カスタム ID も入力できます。既定値ボタンは対応する欄を戻します。キーとリクエストは設定したエンドポイントに送信します。

| プロバイダー | 既定のエンドポイント | 既定のモデル | キーまたはダウンロード |
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

OpenAI 互換サービスは Chat Completions を使用します。推論上書きは任意でモデルに依存します。拡張機能は出力トークン上限を設定しません。[設定](/ja/settings)を参照してください。

## Ollama

`ollama pull qwen3.5:4b` でモデルを取得し、Ollama を起動します。一覧は `/api/tags`、翻訳は `/v1` を使います。オリジンが拒否されたら `OLLAMA_ORIGINS` を設定して再起動します。`OLLAMA_ORIGINS="*" ollama serve` は全オリジンを許可するため、そのアクセスを意図する場合だけ使い、モデルを更新してください。

## 翻訳用の既定値

推奨モデルでは OpenAI Luna、DeepSeek Flash、Qwen 3.8 Flash、Ollama Qwen の思考をオフにし、Groq/Cerebras の GPT-OSS と Grok 4.6 は `low` を使います。Anthropic、Google、その他のモデルはプロバイダーの既定値を維持します。明示的な詳細設定が優先されます。Grok 4.6 と GPT-OSS は `none` 非対応です。

OpenRouter 自動ルーティングは入力 100 万トークンあたり 1 USD、出力は 5 USD が上限です。リクエスト単位や月間の予算ではありません。条件に合うエンドポイントがなければ失敗します。明示的に選んだモデルにはこの制限を適用しません。

基本モードは現在の推奨モデルを使います。詳細モードは保存済みの選択を維持し、既定値ボタンで変更できます。`ollama pull qwen3.5:4b` で約 3.4 GB を取得してください。実行にはさらにメモリーが必要です。選定はカタログに基づき、翻訳ベンチマークの順位ではありません。
