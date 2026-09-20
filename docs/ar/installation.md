# التثبيت

ثبّت النسخة الموقعة من [Chrome Web Store](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba) أو [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/).

للبناء من المصدر، ثبّت [Bun](https://bun.sh) ونفّذ في جذر المستودع:

```sh
bun install --frozen-lockfile
bun run build
```

يستبدل البناء مجلد `dist/`. في Chrome افتح `chrome://extensions/` وفعّل وضع المطور، ثم حمّل `dist/chrome/` كإضافة غير مضغوطة. في Firefox 142 أو أحدث، افتح `about:debugging#/runtime/this-firefox` وحمّل `dist/firefox/manifest.json` مؤقتًا. يزول التثبيت المؤقت عند إغلاق Firefox.

يمكنك أيضًا فك ZIP المناسب للمتصفح من [الإصدارات](https://github.com/adinschmidt/AI-translator/releases). لا تحمّل مجلد المصدر مباشرة. بعد إعادة البناء، أعد تحميل الإضافة وصفحة الويب.
