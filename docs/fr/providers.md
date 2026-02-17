# Fournisseurs et clés API

<a id="general-setup"></a>

AI Translator prend en charge plusieurs fournisseurs d'IA. En mode **Basic**, choisissez entre
OpenAI, Anthropic et Google. En mode **Avancé**, vous pouvez configurer tous
fournisseurs et personnaliser les points de terminaison et les modèles.

## Configuration générale

1. Créez une clé API dans la console du fournisseur.
2. Ouvrez **Options** → sélectionnez le fournisseur.
3. Collez la clé dans le champ **Clé API**.
4. (Mode avancé) Confirmez le point final et le modèle.

## OpenAI

- Créer une clé : [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Point de terminaison par défaut : `https://api.openai.com/v1/chat/completions`
- Modèle par défaut : `gpt-5-mini`

## Anthropic Claude

- Créer une clé : [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- Point de terminaison par défaut : `https://api.anthropic.com/v1/messages`
- Modèle par défaut : `claude-haiku-4-5`

## Google Gemini

- Créez une clé : [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Point de terminaison par défaut : `https://generativelanguage.googleapis.com/v1beta`
- Modèle par défaut : `gemini-3-flash-preview`

## Groq

- Créer une clé : [console.groq.com/keys](https://console.groq.com/keys)
- Point de terminaison par défaut : `https://api.groq.com/openai/v1/chat/completions`
- Modèle par défaut : `qwen/qwen3-32b`

## Grok (xAI)

- Créer une clé : [console.x.ai/api-keys](https://console.x.ai/api-keys)
- Point de terminaison par défaut : `https://api.x.ai/v1/chat/completions`
- Modèle par défaut : `grok-3-mini`

## OpenRouter

- Créez une clé : [openrouter.ai/keys](https://openrouter.ai/keys)
- Point de terminaison par défaut : `https://openrouter.ai/api/v1/chat/completions`
- Modèle par défaut : `openrouter/auto`

## DeepSeek

- Créez une clé : [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- Point de terminaison par défaut : `https://api.deepseek.com/v1/chat/completions`
- Modèle par défaut : `deepseek-chat`

## Mistral AI

- Créer une clé : [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)
- Point de terminaison par défaut : `https://api.mistral.ai/v1/chat/completions`
- Modèle par défaut : `mistral-small-latest`

## Qwen (Alibaba DashScope)

- Créez une clé : [dashscope.console.aliyun.com/apiKey](https://dashscope.console.aliyun.com/apiKey)
- Point de terminaison par défaut : `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`
- Modèle par défaut : `qwen-turbo`

## Cerebras

- Créer une clé : [cloud.cerebras.ai](https://cloud.cerebras.ai/)
- Point de terminaison par défaut : `https://api.cerebras.ai/v1/chat/completions`
- Modèle par défaut : `llama3.1-8b`
- Modèles disponibles :
    - `llama3.1-8b` – Inférence rapide, optimisée pour la vitesse
    - `gpt-oss-120b` – Raisonnement solide dans les domaines des sciences, des mathématiques et du codage
    - `qwen-3-235b-a22b-instruct-2507` – Grand modèle d'instruction
    - `zai-glm-4.7` – Raisonnement avancé avec de fortes performances de codage

## Ollama (Local)

- Installez Ollama : [ollama.com/download](https://ollama.com/download)
- Point de terminaison par défaut : `http://localhost:11434`
- Modèle par défaut : `llama3.2`
- Clé API : non requise

::: tip
Pour les extensions Chrome, Ollama devra peut-être autoriser les requêtes provenant des origines de l'extension.
Exécutez `OLLAMA_ORIGINS="*" ollama serve`, puis cliquez sur **Actualiser** dans les paramètres.
:::
