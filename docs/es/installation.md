# Instalación

Instala la versión firmada desde [Chrome Web Store](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba) o [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/).

Para compilar el código, instala [Bun](https://bun.sh) y ejecuta en la raíz del repositorio:

```sh
bun install --frozen-lockfile
bun run build
```

La compilación reemplaza `dist/`. En Chrome, abre `chrome://extensions/`, activa el modo de desarrollador y carga `dist/chrome/` con **Cargar descomprimida**. En Firefox 142 o posterior, abre `about:debugging#/runtime/this-firefox` y carga temporalmente `dist/firefox/manifest.json`. La instalación temporal desaparece al cerrar Firefox.

También puedes extraer el ZIP de tu navegador desde [Releases](https://github.com/adinschmidt/AI-translator/releases). No cargues la carpeta del código fuente. Después de recompilar, recarga la extensión y la página web.
