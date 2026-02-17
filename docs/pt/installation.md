# Instalação

## Navegadores Chrome/baseados em Chromium

1. Baixe ou clone este repositório.
2. Vá para `chrome://extensions/`.
3. Ative **Modo de desenvolvedor** (alternância no canto superior direito).
4. Clique em **Carregar descompactado** e selecione a pasta de extensão.

## Firefox

1. Baixe ou clone este repositório.
2. Vá para `about:debugging#/runtime/this-firefox`.
3. Clique em **Carregar complemento temporário**.
4. Selecione o arquivo `manifest.json` na pasta de extensão.

::: tip
Os complementos temporários do Firefox são removidos quando o navegador é fechado. Para permanente
instalação, a extensão deve ser assinada pela Mozilla ou instalada no Firefox
Desenvolvedor/Noturno com `xpinstall.signatures.required` definido como `false`.
:::
