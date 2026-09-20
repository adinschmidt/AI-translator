# Troubleshooting

## Installation or settings changes do not take effect

Load the built `dist/chrome/` directory or `dist/firefox/manifest.json`, not the source folder. Firefox requires version 142 or newer. After rebuilding, reload the extension and refresh the webpage. Settings save automatically; check the saved confirmation or displayed error.

## Invalid endpoint, authentication, or model errors

Use a complete endpoint URL. **Fill Default** restores the provider's built-in endpoint or model. Use HTTPS for remote services; local Ollama defaults to HTTP.

For 401 or 403 errors, check the key, account access, and provider billing. For model errors, click **Refresh Models**, choose a model available to your account, or enter its exact ID. Built-in suggestions do not guarantee current availability.

If a request fails after enabling **Override reasoning**, turn it off or choose a level supported by that model. For "API returned no translation text", try another model or a smaller selection. The extension retries some empty streaming responses without streaming; it does not impose an output-token cap.

## Rate limits

Wait for the provider quota to reset or use a model with available capacity. Full-page translation makes multiple requests. Rate-limit retries use backoff; **Stop** cancels an active page run.

## Ollama models fail to load

Ensure Ollama is running and has a downloaded model, for example `ollama pull qwen3.5:4b`. Use `http://localhost:11434` in settings. Model discovery uses `/api/tags`; translation uses the OpenAI-compatible `/v1` API.

If Ollama rejects the extension origin, configure `OLLAMA_ORIGINS` for your extension origin and restart the server. `OLLAMA_ORIGINS="*" ollama serve` allows all origins, so use it only if that access is intended.

## Missing button or wrong target language

The inline button is hidden if language detection fails, the selection is in a sensitive field, or the detected language matches the target. Check **Show Translate button on selection** in Advanced settings or use the context menu.

For Advanced target languages and extra instructions, use the inline button. Context-menu and page translation currently use stored provider instructions and can fall back to English.

## Partial or broken page translation

Reload to restore the original page, then try a smaller selection. Full-page translation runs in the top frame, skips unsupported content, and can retain completed translations after a stop or partial failure.

## Collecting diagnostics

Enable **Debug mode** in Advanced settings for additional error details. Inspect the extension background console and the webpage console. Logs can contain keys, settings, original content, and translations even with debug mode off. Remove sensitive information before sharing a report on [GitHub](https://github.com/adinschmidt/AI-translator/issues).
