# Usage

## Translate selected text

Select text and right-click **Translate Selected Text**, or click the inline **Translate** button. A popup displays the result, usually as it streams in. A selection inside an embedded frame receives its popup in that frame.

The inline button is enabled by default. It appears only when local language detection succeeds and the source differs from your target language. Use the context menu if it does not appear.

Close a popup with its close button. Clicking outside normally dismisses it. **Keep selection translation window open** in Advanced settings retains popups and allows multiple results. Closing an active popup cancels its translation stream.

## Translate a page

Right-click and choose **Translate Page**. The extension collects text regions in the top-level page, translates them in batches, and applies completed regions progressively while preserving supported formatting. Embedded frames are not translated as separate pages. Images, media, and form controls are not translation targets.

The progress indicator shows chunks and errors. **Stop** cancels the active run but leaves already translated regions in place. Reload the webpage to restore its original content. Dynamic pages and unsupported markup can leave content untranslated.

## Language and instruction differences

The inline button uses the selected target language and Advanced mode's extra instructions. Context-menu selection and full-page translation currently use stored provider translation instructions instead, and can fall back to English. See [Settings](/settings#target-language-and-extra-instructions).

Browser internal pages and protected extension-store pages do not allow normal content-script translation. Use an ordinary HTTP or HTTPS page.
