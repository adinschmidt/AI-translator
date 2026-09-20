# Installation

## Browser stores

- [Chrome Web Store](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba)
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/)

## Build from source

Install [Bun](https://bun.sh), clone the repository, and run these commands in its root:

```sh
bun install --frozen-lockfile
bun run build
```

The build replaces `dist/` and produces separate Chrome and Firefox extensions. The repository root is not a loadable extension. Alternatively, extract the matching browser ZIP from [GitHub Releases](https://github.com/adinschmidt/AI-translator/releases).

## Chrome and Chromium

Open `chrome://extensions/`, enable **Developer mode**, choose **Load unpacked**, and select `dist/chrome/`, or the extracted Chrome ZIP folder.

## Firefox

Firefox 142 or newer is required by the current manifest. Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/firefox/manifest.json`, or the manifest in the extracted Firefox ZIP.

Temporary add-ons disappear when Firefox closes. Use Firefox Add-ons for a permanent signed installation.

After rebuilding, reload the extension and refresh the webpages where you use it.
