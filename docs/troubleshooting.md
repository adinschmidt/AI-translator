# Troubleshooting

## "Invalid API Endpoint URL" in settings

Make sure the endpoint starts with `https://` (or `http://` for local Ollama)
and is a full URL. Use **Fill Default** to restore the recommended value.

## 401 / 403 errors

- Double-check the API key in settings.
- Confirm the key is active in the provider console.
- Some providers require billing to be enabled before keys can be used.

## Rate limits or quota errors

Providers can throttle or block requests if you exceed your plan limits.
Try again later or upgrade your provider plan.

## Ollama models fail to load

- Confirm Ollama is running: `ollama serve`.
- Set `OLLAMA_ORIGINS="*"` and restart to allow extension requests.
- Use the default endpoint `http://localhost:11434`.

## Full-page translation looks broken

Full-page translation is experimental. If a page layout breaks, reload the tab
to restore the original content and try translating a smaller selection.

## The extension is unresponsive

- Reload the extension in `chrome://extensions/` or `about:debugging`.
- Reopen the **Options** page and ensure settings are saved.
