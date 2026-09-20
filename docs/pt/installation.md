# Instalação

Instale a versão assinada pela [Chrome Web Store](https://chromewebstore.google.com/detail/jabhdcjhdlnppcpbdghnkfkdpfcfleba) ou pelo [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-translator/).

Para compilar o código, instale [Bun](https://bun.sh) e execute na raiz do repositório:

```sh
bun install --frozen-lockfile
bun run build
```

A compilação substitui `dist/`. No Chrome, abra `chrome://extensions/`, ative o modo de programador e carregue `dist/chrome/` como extensão descompactada. No Firefox 142 ou posterior, abra `about:debugging#/runtime/this-firefox` e carregue temporariamente `dist/firefox/manifest.json`. A instalação temporária termina ao fechar o Firefox.

Também pode extrair o ZIP do navegador nas [versões publicadas](https://github.com/adinschmidt/AI-translator/releases). Não carregue a pasta do código-fonte. Após compilar, recarregue a extensão e a página.
