# Fournisseurs et clés API

Le mode simple propose OpenAI, Anthropic et Google. Le mode avancé propose les 11 fournisseurs. Choisissez-en un et saisissez sa clé ; Ollama n'en exige pas. Les paramètres sont enregistrés automatiquement.

Ces valeurs intégrées ne garantissent pas la disponibilité. Actualisez les modèles pour consulter le catalogue ; en cas d'échec, des suggestions s'affichent. Vous pouvez saisir un ID personnalisé. Les boutons de valeur par défaut rétablissent leur champ. Clés et requêtes sont envoyées à l'endpoint configuré.

| Fournisseur | Endpoint par défaut | Modèle par défaut | Clé ou téléchargement |
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

Les services compatibles OpenAI utilisent Chat Completions. Le raisonnement est facultatif et dépend du modèle. L'extension ne fixe pas de plafond de tokens de sortie. Voir [Paramètres](/fr/settings).

## Ollama

Téléchargez un modèle avec `ollama pull qwen3.5:4b` et lancez Ollama. La liste utilise `/api/tags` et la traduction `/v1`. Si l'origine est refusée, configurez `OLLAMA_ORIGINS` et redémarrez. `OLLAMA_ORIGINS="*" ollama serve` autorise toutes les origines ; utilisez-le seulement si vous souhaitez cet accès. Actualisez ensuite les modèles.

## Réglages de traduction

Les modèles recommandés désactivent le raisonnement pour OpenAI Luna, DeepSeek Flash, Qwen 3.8 Flash et Ollama Qwen. GPT-OSS sur Groq/Cerebras et Grok 4.6 utilisent `low`. Anthropic, Google et les autres modèles gardent leurs valeurs. Un réglage avancé explicite est prioritaire. Grok 4.6 et GPT-OSS ne prennent pas en charge `none`.

Le routage automatique OpenRouter est plafonné à 1 $ par million de tokens en entrée et 5 $ en sortie. Ce n'est pas un budget par requête ou par mois. Sans endpoint admissible, la requête échoue. Les modèles choisis explicitement ne sont pas plafonnés.

Le mode simple utilise les modèles actuels. Le mode avancé conserve votre choix ; rétablissez la valeur par défaut pour changer. Installez `ollama pull qwen3.5:4b`, environ 3,4 Go à télécharger, avec davantage de mémoire nécessaire à l'exécution. Ces choix reposent sur les catalogues, pas sur un classement mesuré des traductions.
