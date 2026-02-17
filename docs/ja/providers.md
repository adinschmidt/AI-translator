# プロバイダーと API キー

AI Translator は複数の AI プロバイダーに対応しています。**Basic** モードでは
OpenAI、Anthropic、Google から選択できます。**Advanced** モードでは、すべての対応プロバイダーを設定し、エンドポイントやモデルをカスタマイズできます。

<a id="general-setup"></a>

## 共通セットアップ

1. 各プロバイダーのコンソールで API キーを作成します。
2. **Options** を開き、プロバイダーを選択します。
3. **API Key** フィールドにキーを貼り付けます。
4. （Advanced モード）エンドポイントとモデルを確認します。

## OpenAI

- キーの作成: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- 既定のエンドポイント: `https://api.openai.com/v1/chat/completions`
- 既定のモデル: `gpt-5-mini`

## Anthropic Claude

- キーの作成: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- 既定のエンドポイント: `https://api.anthropic.com/v1/messages`
- 既定のモデル: `claude-haiku-4-5`

## Google Gemini

- キーの作成: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- 既定のエンドポイント: `https://generativelanguage.googleapis.com/v1beta`
- 既定のモデル: `gemini-3-flash-preview`

## Groq

- キーの作成: [console.groq.com/keys](https://console.groq.com/keys)
- 既定のエンドポイント: `https://api.groq.com/openai/v1/chat/completions`
- 既定のモデル: `qwen/qwen3-32b`

## Grok (xAI)

- キーの作成: [console.x.ai/api-keys](https://console.x.ai/api-keys)
- 既定のエンドポイント: `https://api.x.ai/v1/chat/completions`
- 既定のモデル: `grok-3-mini`

## OpenRouter

- キーの作成: [openrouter.ai/keys](https://openrouter.ai/keys)
- 既定のエンドポイント: `https://openrouter.ai/api/v1/chat/completions`
- 既定のモデル: `openrouter/auto`

## DeepSeek

- キーの作成: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- 既定のエンドポイント: `https://api.deepseek.com/v1/chat/completions`
- 既定のモデル: `deepseek-chat`

## Mistral AI

- キーの作成: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- 既定のエンドポイント: `https://api.mistral.ai/v1/chat/completions`
- 既定のモデル: `mistral-small-latest`

## Qwen (Alibaba DashScope)

- キーの作成: [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- 既定のエンドポイント: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- 既定のモデル: `qwen-turbo`

## Cerebras

- キーの作成: [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- 既定のエンドポイント: `https://api.cerebras.ai/v1/chat/completions`
- 既定のモデル: `llama3.1-8b`
- 利用可能なモデル:
    - `llama3.1-8b` - 高速推論向け
    - `gpt-oss-120b` - 科学・数学・コーディングで強い推論性能
    - `qwen-3-235b-a22b-instruct-2507` - 大規模 instruct モデル
    - `zai-glm-4.7` - 高度な推論と強力なコーディング性能

## Ollama (ローカル)

- Ollama のインストール: [ollama.com/download](https://ollama.com/download)
- 既定のエンドポイント: `http://localhost:11434`
- 既定のモデル: `llama3.2`
- API キー: 不要

::: tip
Chrome 拡張機能では、Ollama 側で拡張機能オリジンからのリクエストを許可する必要がある場合があります。
`OLLAMA_ORIGINS="*" ollama serve` を実行し、設定画面で **Refresh** をクリックしてください。
:::
