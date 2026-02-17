# 공급자 및 API 키

<a id="general-setup"></a>

AI Translator은 여러 AI 공급자를 지원합니다. **기본** 모드에서 다음 중 하나를 선택하세요.
OpenAI, Anthropic 및 Google. **고급** 모드에서는 모든 항목을 구성할 수 있습니다.
공급자를 제공하고 엔드포인트와 모델을 사용자 정의합니다.

## 일반 설정

1. 공급자 콘솔에서 API 키를 생성합니다.
2. **옵션**을 열고 → 공급자를 선택합니다.
3. 키를 **API 키** 필드에 붙여넣습니다.
4. (고급 모드) 엔드포인트와 모델을 확인합니다.

## OpenAI

- 키 생성: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- 기본 엔드포인트: `https://api.openai.com/v1/chat/completions`
- 기본 모델: `gpt-5-mini`

## Anthropic 클로드

- 키 생성: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- 기본 엔드포인트: `https://api.anthropic.com/v1/messages`
- 기본 모델: `claude-haiku-4-5`

## Google Gemini

- 키 생성: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- 기본 엔드포인트: `https://generativelanguage.googleapis.com/v1beta`
- 기본 모델: `gemini-3-flash-preview`

## Groq

- 키 생성: [console.groq.com/keys](https://console.groq.com/keys)
- 기본 엔드포인트: `https://api.groq.com/openai/v1/chat/completions`
- 기본 모델: `qwen/qwen3-32b`

## Grok (xAI)

- 키 생성: [console.x.ai/api-keys](https://console.x.ai/api-keys)
- 기본 엔드포인트: `https://api.x.ai/v1/chat/completions`
- 기본 모델: `grok-3-mini`

## OpenRouter

- 키 생성: [openrouter.ai/keys](https://openrouter.ai/keys)
- 기본 엔드포인트: `https://openrouter.ai/api/v1/chat/completions`
- 기본 모델: `openrouter/auto`

## DeepSeek

- 키 생성: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- 기본 엔드포인트: `https://api.deepseek.com/v1/chat/completions`
- 기본 모델: `deepseek-chat`

## Mistral AI

- 키 생성: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- 기본 엔드포인트: `https://api.mistral.ai/v1/chat/completions`
- 기본 모델: `mistral-small-latest`

## Qwen (알리바바 대시스코프)

- 키 생성: [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- 기본 엔드포인트: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- 기본 모델: `qwen-turbo`

## Cerebras

- 키 생성: [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- 기본 엔드포인트: `https://api.cerebras.ai/v1/chat/completions`
- 기본 모델: `llama3.1-8b`
- 사용 가능한 모델:
    - `llama3.1-8b` – 빠른 추론, 속도에 최적화됨
    - `gpt-oss-120b` – 과학, 수학, 코딩 전반에 걸친 강력한 추론
    - `qwen-3-235b-a22b-instruct-2507` – 대형 지시 모델
    - `zai-glm-4.7` – 강력한 코딩 성능을 갖춘 고급 추론

## Ollama (로컬)

- Ollama 설치: [ollama.com/download](https://ollama.com/download)
- 기본 엔드포인트: `http://localhost:11434`
- 기본 모델: `llama3.2`
- API 키: 필요하지 않음

::: tip
Chrome 확장 프로그램의 경우 Ollama은 확장 원본의 요청을 허용해야 할 수도 있습니다.
`OLLAMA_ORIGINS="*" ollama serve`을 실행한 다음 설정에서 **새로 고침**을 클릭하세요.
:::
