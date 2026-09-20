# Fournisseurs et clés API

Le mode simple propose OpenAI, Anthropic et Google. Le mode avancé propose les 11 fournisseurs. Choisissez-en un et saisissez sa clé ; Ollama n'en exige pas. Les paramètres sont enregistrés automatiquement.

Ces valeurs intégrées ne garantissent pas la disponibilité. Actualisez les modèles pour consulter le catalogue ; en cas d'échec, des suggestions s'affichent. Vous pouvez saisir un ID personnalisé. Les boutons de valeur par défaut rétablissent leur champ. Clés et requêtes sont envoyées à l'endpoint configuré.

| Fournisseur | Endpoint par défaut | Modèle par défaut | Clé ou téléchargement |
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

Les services compatibles OpenAI utilisent Chat Completions. Le raisonnement est facultatif et dépend du modèle. L'extension ne fixe pas de plafond de tokens de sortie. Voir [Paramètres](/fr/settings).

## Ollama

Téléchargez un modèle avec `ollama pull llama3.2` et lancez Ollama. La liste utilise `/api/tags` et la traduction `/v1`. Si l'origine est refusée, configurez `OLLAMA_ORIGINS` et redémarrez. `OLLAMA_ORIGINS="*" ollama serve` autorise toutes les origines ; utilisez-le seulement si vous souhaitez cet accès. Actualisez ensuite les modèles.
