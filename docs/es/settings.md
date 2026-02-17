# Configuración

Abra el menú de extensión y haga clic en **Opciones** para configurar AI Translator.

## Modos

### Modo básico

- Elija un proveedor (OpenAI, Anthropic o Google).
- Ingrese una clave API.
- Seleccione su idioma de destino.
- La extensión utiliza puntos finales y modelos recomendados automáticamente.

### Modo avanzado

- Seleccione entre todos los proveedores compatibles.
- Personalice el punto final de API, el nombre del modelo y las instrucciones de traducción.
- Ideal para configuraciones autohospedadas, compatibles con OpenAI o de usuario avanzado.

## Instrucciones de traducción

Utilice **Instrucciones de traducción** para controlar el tono y el estilo. El texto seleccionado es
añadido automáticamente. Ejemplo:

```
Translate to Spanish. Keep the tone friendly and concise.
```

## Punto final y modelo de API

Cada proveedor tiene una opción **Completar valor predeterminado** que restablece el valor recomendado
punto final y nombre del modelo. Puede anular ambos en el modo Avanzado si es necesario.

## Almacenamiento y privacidad

Las configuraciones se almacenan en `chrome.storage.sync` para que persistan en todos los dispositivos.
Las claves API nunca se registran en la consola.
