# Privacy Policy for AI Translator

**Last Updated:** January 10, 2026

## 1. Overview

AI Translator ("we", "our", or "the extension") is a client-side browser extension that allows users to translate text using their own AI API keys. The extension operates entirely within your browser and does not transmit data to any servers owned or operated by the developer.

**This is not legal advice.** This policy describes how the extension handles data to help you make an informed decision about using it.

## 2. Data Collection and Storage

- **Personal Data:** We (the developer) do not collect, store, or have access to any personal data, translated text, or browsing history.
- **API Keys:** Your API keys are stored exclusively on your device using the browser's synchronized storage (`browser.storage.sync`). This means your settings sync across your browsers when signed in, but they are never transmitted to the developer or any third party other than the specific AI provider you choose for translation requests.
- **No Backend Server:** This extension does not operate a backend server. All processing happens locally in your browser.

## 3. Data Sharing with Third Parties

To function, this extension sends the text you explicitly select for translation directly from your browser to the AI provider you have configured. By using this extension, you acknowledge that your data is subject to the privacy policies of these providers:

| Provider | Privacy Policy |
|----------|----------------|
| **OpenAI** | [https://openai.com/privacy](https://openai.com/privacy) |
| **Anthropic** | [https://www.anthropic.com/legal/privacy](https://www.anthropic.com/legal/privacy) |
| **Google (Gemini)** | [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms) |
| **xAI (Grok)** | [https://x.ai/legal/privacy-policy](https://x.ai/legal/privacy-policy) |
| **OpenRouter** | [https://openrouter.ai/privacy](https://openrouter.ai/privacy) |
| **Ollama (Local)** | Data stays on your local machine; no external transmission. |

**Important considerations:**
- Some providers may use your data to train their models unless you opt out (check each provider's policy).
- OpenRouter routes requests to various underlying AI providers, each with their own data policies.
- We do not sell, trade, or otherwise transfer your data to outside parties.

## 4. Browser Store Policies

When distributed through browser extension stores, this extension adheres to the applicable user data policies, including [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/) and [Firefox Add-on Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/).

## 5. Permissions Explanation

This extension requests the following permissions:

| Permission | Purpose |
|------------|---------|
| `contextMenus` | Adds "Translate" option to your right-click menu |
| `scripting` | Injects the translation UI overlay on web pages |
| `storage` | Saves your API keys and preferences locally |
| `host_permissions` (`<all_urls>`) | Required to display translations on any webpage you visit and to make API calls to your chosen AI provider |

## 6. User Control

- **Deletion:** You can remove all data stored by this extension by uninstalling the extension or clearing your browser's extension data.
- **Opt-out:** No data is sent to AI providers unless you explicitly trigger a translation action.
- **Provider Choice:** You control which AI provider receives your data by selecting it in the extension settings.

## 7. Security

- API keys are stored in the browser's secure storage and are only transmitted over HTTPS to the AI provider endpoints.
- The extension does not log, cache, or retain any translated text after displaying it.

## 8. Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last Updated" date at the top of this document.

## 9. Contact

If you have questions about this policy, please open an issue on the [GitHub repository](https://github.com/adinschmidt/AI-translator/issues).

---

*This extension is open source. You can review the code to verify these privacy claims.*
