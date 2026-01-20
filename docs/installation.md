# Installation

## Chrome / Chromium-based browsers

1. Download or clone this repository.
2. Go to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the extension folder.

## Firefox

1. Download or clone this repository.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Select the `manifest.json` file in the extension folder.

::: tip
Temporary add-ons in Firefox are removed when the browser closes. For permanent
installation, the extension must be signed by Mozilla or installed in Firefox
Developer/Nightly with `xpinstall.signatures.required` set to `false`.
:::
