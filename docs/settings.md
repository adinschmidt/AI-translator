# Settings

Click the extension's toolbar icon to open settings. Changes save automatically; wait for the saved confirmation before closing the page.

## Appearance

Choose the interface language independently of the translation language. The default follows the browser language. English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, and Hindi are available. Choose Light, Dark, or System for the theme.

## Basic and Advanced modes

Basic mode offers OpenAI, Anthropic, and Google with built-in endpoints and models. Enter your key and choose a target language, including **Custom…** for a language you type yourself. The initial target is English.

Advanced mode offers all 11 [providers](/providers). API keys, endpoints, models, and reasoning overrides are saved per provider. Basic and Advanced modes keep separate target languages. Saving in Basic mode restores the selected provider's default model and endpoint.

Use **Refresh Models** to request the provider's current model list. Lists can also load when you switch providers or change credentials or endpoints. If discovery fails, the extension shows built-in suggestions. You can filter the list or type a custom model name. **Fill Default** beside a field resets that field to its built-in value.

## Target language and extra instructions

Choose the target language separately from **Extra instructions**. For example:

```text
Keep the tone friendly and preserve technical terminology.
```

The inline selection button automatically includes the detected source language, target language, and Advanced mode's extra instructions.

::: warning Current limitation
The context-menu selection and full-page paths use stored provider translation instructions instead. They do not apply Advanced mode's extra instructions or reliably follow its target language. They can fall back to English. Use the inline button when those controls matter.
:::

## Override reasoning

In Advanced mode, turn on **Override reasoning** to reveal the level selector: `none`, `minimal`, `low`, `medium`, `high`, or `xhigh`. The initial selection is `low`. With the toggle off, the extension omits the reasoning override and uses the provider default. Basic mode does not apply an override.

Support depends on the provider and model. Unsupported levels may be ignored or rejected. More reasoning can increase latency and cost. The extension does not set an output-token cap; provider and model limits still apply.

## Behavior and diagnostics

These controls appear in Advanced mode:

- **Show Translate button on selection** defaults to on. The button requires successful local language detection and a source language different from the target.
- **Keep selection translation window open** defaults to off. Enable it to retain popups when clicking elsewhere and keep multiple results. Close each with its close button.
- **Redact sensitive data** defaults to on. Pattern matching replaces recognized email addresses, phone numbers, US SSNs, and Canadian SINs before API requests. It can miss sensitive data. Matched text stays redacted in the result.
- **Debug mode** defaults to off. It adds diagnostic details to errors and logs. Ordinary logs can still contain settings, API keys, selected content, and translations when it is off.

## Storage

Settings and keys use `chrome.storage.sync`. Browser sync may copy them across signed-in devices; they are not exclusively local. Review [Privacy](/privacy) before sharing console logs or translating sensitive content.
