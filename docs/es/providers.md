# Proveedores y claves API

<a id="general-setup"></a>

AI Translator admite múltiples proveedores de IA. En el modo **Básico**, elige entre
OpenAI, Anthropic y Google. En el modo **Avanzado**, puedes configurar todo
proveedores y personalizar puntos finales y modelos.

## Configuración general

1. Cree una clave API en la consola del proveedor.
2. Abra **Opciones** → seleccione el proveedor.
3. Pegue la clave en el campo **Clave API**.
4. (Modo avanzado) Confirme el punto final y el modelo.

## OpenAI

- Crear una clave: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Punto final predeterminado: `https://api.openai.com/v1/chat/completions`
- Modelo predeterminado: `gpt-5-mini`

## Anthropic Claude

- Crear una clave: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- Punto final predeterminado: `https://api.anthropic.com/v1/messages`
- Modelo predeterminado: `claude-haiku-4-5`

## Google Gemini

- Crear una clave: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Punto final predeterminado: `https://generativelanguage.googleapis.com/v1beta`
- Modelo predeterminado: `gemini-3-flash-preview`

## Groq

- Crear una clave: [console.groq.com/keys](https://console.groq.com/keys)
- Punto final predeterminado: `https://api.groq.com/openai/v1/chat/completions`
- Modelo predeterminado: `qwen/qwen3-32b`

## Grok (xAI)

- Crear una clave: [console.x.ai/api-keys](https://console.x.ai/api-keys)
- Punto final predeterminado: `https://api.x.ai/v1/chat/completions`
- Modelo predeterminado: `grok-3-mini`

## OpenRouter

- Crear una clave: [openrouter.ai/keys](https://openrouter.ai/keys)
- Punto final predeterminado: `https://openrouter.ai/api/v1/chat/completions`
- Modelo predeterminado: `openrouter/auto`

## DeepSeek

- Crear una clave: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- Punto final predeterminado: `https://api.deepseek.com/v1/chat/completions`
- Modelo predeterminado: `deepseek-chat`

## Mistral AI

- Crear una clave: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- Punto final predeterminado: `https://api.mistral.ai/v1/chat/completions`
- Modelo predeterminado: `mistral-small-latest`

## Qwen (Alibaba DashScope)

- Crear una clave: [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- Punto final predeterminado: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- Modelo predeterminado: `qwen-turbo`

## Cerebras

- Crear una clave: [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- Punto final predeterminado: `https://api.cerebras.ai/v1/chat/completions`
- Modelo predeterminado: `llama3.1-8b`
- Modelos disponibles:
    - `llama3.1-8b` – Inferencia rápida, optimizada para la velocidad
    - `gpt-oss-120b`: razonamiento sólido en ciencias, matemáticas y codificación.
    - `qwen-3-235b-a22b-instruct-2507` – Modelo de instrucción grande
    - `zai-glm-4.7` – Razonamiento avanzado con un sólido rendimiento de codificación

## Ollama (local)

- Instalar Ollama: [ollama.com/download](https://ollama.com/download)
- Punto final predeterminado: `http://localhost:11434`
- Modelo predeterminado: `llama3.2`
- Clave API: no requerida

::: tip
Para las extensiones de Chrome, es posible que Ollama deba permitir solicitudes desde los orígenes de la extensión.
Ejecute `OLLAMA_ORIGINS="*" ollama serve` y luego haga clic en **Actualizar** en la configuración.
:::
