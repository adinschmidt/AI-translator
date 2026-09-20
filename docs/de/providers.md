# Anbieter und API-Schlüssel

Der Basismodus bietet OpenAI, Anthropic und Google. Der erweiterte Modus bietet alle 11 Anbieter. Wähle einen Anbieter und trage seinen Schlüssel ein; Ollama braucht keinen. Einstellungen werden automatisch gespeichert.

Diese integrierten Werte garantieren keine Verfügbarkeit. Aktualisiere die Modelle für den aktuellen Katalog; bei Fehlern erscheinen Vorschläge. Eigene Modell-IDs sind möglich. Standardschaltflächen setzen ihr jeweiliges Feld zurück. Schlüssel und Anfragen gehen an den eingestellten Endpunkt.

| Anbieter | Standardendpunkt | Standardmodell | Schlüssel oder Download |
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

OpenAI-kompatible Dienste verwenden Chat Completions. Reasoning ist optional und modellabhängig. Die Erweiterung setzt keine Ausgabetoken-Grenze. Siehe [Einstellungen](/de/settings).

## Ollama

Lade mit `ollama pull qwen3.5:4b` ein Modell und starte Ollama. Die Liste verwendet `/api/tags`, die Übersetzung `/v1`. Bei abgelehntem Ursprung setze `OLLAMA_ORIGINS` und starte neu. `OLLAMA_ORIGINS="*" ollama serve` erlaubt alle Ursprünge; verwende dies nur, wenn dieser Zugriff beabsichtigt ist. Aktualisiere danach die Modelle.

## Übersetzungsvorgaben

Empfohlene Modelle schalten Reasoning für OpenAI Luna, DeepSeek Flash, Qwen 3.8 Flash und Ollama Qwen aus. GPT-OSS auf Groq/Cerebras und Grok 4.6 verwenden `low`. Anthropic, Google und andere Modelle behalten ihre Vorgaben. Explizite erweiterte Einstellungen haben Vorrang. Grok 4.6 und GPT-OSS unterstützen `none` nicht.

Automatisches OpenRouter-Routing hat eine Preisgrenze von 1 USD je Million Eingabetokens und 5 USD je Million Ausgabetokens. Das ist kein Anfragen- oder Monatsbudget. Ohne passenden Endpunkt schlägt die Anfrage fehl. Explizit gewählte Modelle haben diese Grenze nicht.

Der Basismodus nutzt aktuelle Standardmodelle. Der erweiterte Modus behält die gespeicherte Wahl; setze das Modellfeld auf den Standardwert zurück, um zu wechseln. Installiere `ollama pull qwen3.5:4b`: etwa 3,4 GB Download, mit höherem Speicherbedarf beim Ausführen. Die Auswahl beruht auf Katalogen, nicht auf gemessenen Übersetzungsvergleichen.
