# 공급자 및 API 키

기본 모드는 OpenAI, Anthropic, Google을, 고급 모드는 11개 공급자 모두를 제공합니다. 공급자를 고르고 키를 입력하세요. Ollama는 키가 필요 없습니다. 설정은 자동 저장됩니다.

아래는 내장 기본값이며 사용 가능성을 보장하지 않습니다. 모델 새로고침으로 목록을 요청하고 실패하면 추천을 표시합니다. 사용자 지정 ID도 입력할 수 있습니다. 기본값 버튼은 해당 필드를 복원합니다. 키와 요청은 설정한 엔드포인트로 갑니다.

| 공급자 | 기본 엔드포인트 | 기본 모델 | 키 또는 다운로드 |
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

OpenAI 호환 서비스는 Chat Completions를 사용합니다. 추론 재정의는 선택 사항이며 모델에 따라 다릅니다. 확장 프로그램은 출력 토큰 상한을 설정하지 않습니다. [설정](/ko/settings)을 참고하세요.

## Ollama

`ollama pull qwen3.5:4b`로 모델을 받고 Ollama를 실행하세요. 목록은 `/api/tags`, 번역은 `/v1`을 사용합니다. 출처가 거부되면 `OLLAMA_ORIGINS`를 설정하고 재시작하세요. `OLLAMA_ORIGINS="*" ollama serve`는 모든 출처를 허용하므로 그 접근을 원할 때만 사용한 뒤 모델을 새로고침하세요.

## 번역 기본값

권장 모델에서 OpenAI Luna, DeepSeek Flash, Qwen 3.8 Flash, Ollama Qwen은 사고를 끕니다. Groq/Cerebras의 GPT-OSS와 Grok 4.6은 `low`를 사용합니다. Anthropic, Google과 다른 모델은 공급자 기본값을 유지합니다. 명시적인 고급 재정의가 우선합니다. Grok 4.6과 GPT-OSS는 `none`을 지원하지 않습니다.

OpenRouter 자동 라우팅의 상한은 입력 백만 토큰당 1 USD, 출력은 5 USD입니다. 요청별 또는 월간 예산이 아닙니다. 맞는 엔드포인트가 없으면 실패합니다. 직접 선택한 모델에는 이 상한이 없습니다.

기본 모드는 현재 권장 모델을 사용합니다. 고급 모드는 저장한 선택을 유지하며 기본값 버튼으로 바꿀 수 있습니다. `ollama pull qwen3.5:4b`로 약 3.4 GB를 받으세요. 실행에는 더 많은 메모리가 필요합니다. 선택은 카탈로그를 기준으로 했으며 번역 벤치마크 순위가 아닙니다.
