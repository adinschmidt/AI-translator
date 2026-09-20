# Privacy policy for AI Translator

Last updated: September 20, 2026

## Requests and storage

AI Translator has no developer-operated translation backend or analytics service. Translation requests go from your browser to the configured AI endpoint. They include selected text or page regions and translation instructions. Cloud providers process that content outside your device under their own retention and data-use policies. OpenRouter can forward requests to underlying providers.

Options can request model lists when you select a provider, change credentials or endpoints, or click **Refresh Models**. These requests may include your API key but do not require a translation action.

Settings and API keys are stored in `chrome.storage.sync`. Your browser's sync service may copy them to other signed-in devices. This is not exclusively on-device storage or a separate encrypted secrets vault. The extension does not store a persistent translation history, but results remain in page content, open popups, and temporary in-memory state.

## Local models and custom endpoints

The default Ollama endpoint is `http://localhost:11434`. Processing stays local only when your configured server and model run locally without forwarding requests. Custom endpoints receive your requests and credentials. HTTPS protects transport to HTTPS endpoints; HTTP endpoints, including local Ollama, do not encrypt transport.

## Redaction and logs

Sensitive-data redaction is enabled by default. It replaces recognized email addresses, phone numbers, US Social Security numbers, and Canadian Social Insurance numbers with placeholders before translation requests. Pattern matching can miss information. Quoted HTML attribute values are replaced with temporary placeholders and restored locally after translation.

Console logs can contain API keys, settings, original selections, page metadata, provider errors, and translated content. Some of these logs exist even when Debug mode is off. Redaction of API input does not redact all local logs. Review and remove sensitive data before sharing logs or screenshots.

## Permissions

| Permission | Purpose |
| --- | --- |
| `contextMenus` | Adds selection and page translation actions. |
| `scripting` | Injects translation scripts when needed. |
| `storage` | Saves settings and API keys using browser sync storage. |
| `https://*/*`, `http://*/*` host access | Runs content scripts on webpages and connects to configured provider endpoints. |

Content scripts run in matching frames to support selections. Full-page translation starts only in the top frame. Language detection runs locally using the bundled ELD library. The extension bundles its runtime scripts, including DOMPurify.

## Your controls

Choose the provider and endpoint in settings, remove saved keys there, or clear the extension's browser data. Browser sync may also hold copies. You control when to start translations and can stop an active page run. Stopping cannot retract content already sent to a provider. Check your provider's current privacy and retention policy before translating sensitive material.

For questions, open an issue in the [GitHub repository](https://github.com/adinschmidt/AI-translator/issues). Avoid including private content or credentials.
