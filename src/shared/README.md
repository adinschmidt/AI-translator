# Shared code

- `constants/` defines provider defaults, reasoning levels, settings defaults, prompts, languages, and batching/retry limits.
- `storage.ts` provides typed settings and wrappers around `chrome.storage.sync`.
- `translation-profile.ts` resolves effective settings and normalizes legacy provider configuration. Reasoning overrides apply only in Advanced mode when enabled with a valid level.
- `provider-behavior.ts` handles endpoint normalization, model discovery filtering and fallbacks, provider headers, and streaming compatibility.
- `messaging.ts` defines runtime messages and translation-port payloads.
- `runtime-jobs.ts` tracks cancellable requests and tab/frame ownership.
- `sensitive.ts` redacts recognized sensitive text and protects quoted HTML attribute values with locally restorable placeholders.
- `i18n.ts` resolves interface locales and loads bundled messages from `_locales/`.
- `index.ts` exports shared modules.

Storage and localization helpers use browser extension APIs. Pure provider, profile, and redaction helpers can be exercised independently of the DOM.
