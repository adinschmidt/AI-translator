# AI Translator

A browser extension that leverages customizable AI models for superior text and page translations.

<a href="https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba">
  <img src="https://img.shields.io/badge/Chrome_Web_Store-Available-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Available in the Chrome Web Store">
</a>

## Why AI Translator?

- **More Coherent Output**: AI translation delivers natural, context-aware results that surpass traditional Machine Translation (MTL) in coherence and fluency.
- Right-click to translate selected text or entire pages.
- Fully customizable AI models and settings.

## Screenshots

### AI vs. Traditional Translation
AI-powered translation provides more natural and contextually accurate results compared to traditional services.

| Traditional (DeepL) | AI Translator |
| :--- | :--- |
| ![DeepL Translation](images/screenshot_deepl.png) | ![AI Selection Translation](images/screenshot_selection.png) |


### Additional Previews
![Full Page Translation](images/screenshot_fullpage.png)
![Settings Page](images/screenshot_settings.png)

## Installation

### Chrome / Chromium-based browsers

1. Download or clone this repository.
2. Go to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the extension folder.

### Firefox

1. Download or clone this repository.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Select the `manifest.json` file in the extension folder.

> **Note:** Temporary add-ons in Firefox are removed when the browser closes. For permanent installation, the extension must be signed by Mozilla or installed in Firefox Developer/Nightly with `xpinstall.signatures.required` set to `false`.

## Usage

1. **Text Translation**: Select text on any webpage, right-click → "Translate Selected Text".
2. **Page Translation**: Right-click anywhere on the page → "Translate Page".
3. **Configure**: Click the extension icon → *Options* to set up API keys, models, languages, etc.

## Options Page Features

- Select AI providers and models (e.g., GPT, Claude).
- Set source and target languages.
- Manage API keys securely.
- Customize translation behavior.

## Roadmap & Current State

### Current Caveats
- **Full-Page Translation**: Functional but experimental. Complex layouts may come out broken after text replacement. Large pages can occasionally hang during the DOM traversal phase.

## Tech Stack

- Manifest V3
- Content scripts for page interaction
- Service worker for background API calls
- Tailwind CSS for styling

## Privacy

We value your privacy. This extension operates client-side and does not collect your data.

**Permissions:**
- `activeTab`: Used to access the content of the current tab only when you explicitly interact with the extension (e.g., clicking a context menu item). This replaces the broad `<all_urls>` permission, ensuring the extension only runs when you want it to.
- `storage`: Used to save your settings locally.
- `scripting`: Used to inject translation scripts into the page when requested.

See our [Privacy Policy](PRIVACY.md) for full details.
