# Instalación

## Chrome/navegadores basados en Chromium

1. Descargue o clone este repositorio.
2. Vaya a `chrome://extensions/`.
3. Habilite **Modo de desarrollador** (alternancia superior derecha).
4. Haga clic en **Cargar descomprimido** y seleccione la carpeta de extensión.

## Firefox

1. Descargue o clone este repositorio.
2. Vaya a `about:debugging#/runtime/this-firefox`.
3. Haga clic en **Cargar complemento temporal**.
4. Seleccione el archivo `manifest.json` en la carpeta de extensión.

::: tip
Los complementos temporales en Firefox se eliminan cuando se cierra el navegador. Para permanente
instalación, la extensión debe estar firmada por Mozilla o instalada en Firefox
Desarrollador/Nocturno con `xpinstall.signatures.required` configurado en `false`.
:::
