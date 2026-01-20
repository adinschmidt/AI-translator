# Settings

Open the extension menu and click **Options** to configure AI Translator.

## Modes

### Basic mode

- Choose a provider (OpenAI, Anthropic, or Google).
- Enter an API key.
- Select your target language.
- The extension uses recommended endpoints and models automatically.

### Advanced mode

- Select from all supported providers.
- Customize API endpoint, model name, and translation instructions.
- Ideal for self-hosted, OpenAI-compatible, or power-user setups.

## Translation instructions

Use **Translation Instructions** to control tone and style. The selected text is
appended automatically. Example:

```
Translate to Spanish. Keep the tone friendly and concise.
```

## API endpoint & model

Each provider has a **Fill Default** option that restores the recommended
endpoint and model name. You can override both in Advanced mode if needed.

## Storage & privacy

Settings are stored in `chrome.storage.sync` so they persist across devices.
API keys are never logged to the console.
