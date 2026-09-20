# इंस्टॉलेशन

हस्ताक्षरित संस्करण [Chrome Web Store](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba) या [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/) से इंस्टॉल करें।

सोर्स से बनाने के लिए [Bun](https://bun.sh) इंस्टॉल करें और रिपॉज़िटरी की रूट में चलाएँ:

```sh
bun install --frozen-lockfile
bun run build
```

बिल्ड `dist/` को बदल देता है। Chrome में `chrome://extensions/` खोलें, डेवलपर मोड चालू करें और अनपैक्ड एक्सटेंशन के रूप में `dist/chrome/` चुनें। Firefox 142 या नए संस्करण में `about:debugging#/runtime/this-firefox` खोलकर `dist/firefox/manifest.json` को अस्थायी ऐड-ऑन के रूप में लोड करें। Firefox बंद होने पर अस्थायी इंस्टॉलेशन हट जाता है।

आप [रिलीज़](https://github.com/adinschmidt/AI-translator/releases) से अपने ब्राउज़र का ZIP भी निकाल सकते हैं। सोर्स फ़ोल्डर सीधे लोड न करें। दोबारा बिल्ड करने के बाद एक्सटेंशन और वेबपेज रीलोड करें।
