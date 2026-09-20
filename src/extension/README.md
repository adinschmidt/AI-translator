# Extension code

Bun bundles three browser entry points in `build.ts`:

- `background.ts` handles context menus, provider calls through AI SDK 7, redaction, batching, retries, and cancellation. Chrome loads it as a service worker; Firefox loads it as a background script.
- `content.ts` handles local language detection, selection buttons and popups, and collection and replacement of page text regions. Selection messages target the originating frame. Full-page translation starts in the top frame.
- `options.ts` handles appearance, automatic settings persistence, provider configuration, and model discovery. Its markup and styles are in `assets/`.

`translation-request.ts` coordinates selected-text streaming, non-streaming fallback, and result delivery. `page-translation-run.ts` tracks page regions, chunk results, progress, cancellation, and application of completed regions.

Shared message contracts, provider behavior, settings resolution, redaction, and localization live in `../shared/`. Runtime bundles are generated in `dist/chrome/` and `dist/firefox/`; edit the source files rather than those outputs.
