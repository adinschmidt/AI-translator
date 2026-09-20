# 공급자 및 API 키

기본 모드는 OpenAI, Anthropic, Google을, 고급 모드는 11개 공급자 모두를 제공합니다. 공급자를 고르고 키를 입력하세요. Ollama는 키가 필요 없습니다. 설정은 자동 저장됩니다.

아래는 내장 기본값이며 사용 가능성을 보장하지 않습니다. 모델 새로고침으로 목록을 요청하고 실패하면 추천을 표시합니다. 사용자 지정 ID도 입력할 수 있습니다. 기본값 버튼은 해당 필드를 복원합니다. 키와 요청은 설정한 엔드포인트로 갑니다.

| 공급자 | 기본 엔드포인트 | 기본 모델 | 키 또는 다운로드 |
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

OpenAI 호환 서비스는 Chat Completions를 사용합니다. 추론 재정의는 선택 사항이며 모델에 따라 다릅니다. 확장 프로그램은 출력 토큰 상한을 설정하지 않습니다. [설정](/ko/settings)을 참고하세요.

## Ollama

`ollama pull llama3.2`로 모델을 받고 Ollama를 실행하세요. 목록은 `/api/tags`, 번역은 `/v1`을 사용합니다. 출처가 거부되면 `OLLAMA_ORIGINS`를 설정하고 재시작하세요. `OLLAMA_ORIGINS="*" ollama serve`는 모든 출처를 허용하므로 그 접근을 원할 때만 사용한 뒤 모델을 새로고침하세요.
