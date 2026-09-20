# Ajustes

Pulsa el icono de la extensión. Los cambios se guardan automáticamente. El idioma de la interfaz es independiente del idioma de destino; puedes seguir el del navegador o elegir entre 12 idiomas. El tema puede ser claro, oscuro o del sistema.

El modo básico ofrece OpenAI, Anthropic y Google. El modo avanzado ofrece 11 proveedores y guarda clave, modelo, endpoint y razonamiento por proveedor. Cada modo conserva su idioma de destino, inicialmente inglés, y permite escribir uno personalizado. Guardar en modo básico restablece el modelo y endpoint predeterminados del proveedor.

**Actualizar modelos** consulta el catálogo del proveedor. También puede consultarlo al cambiar proveedor, clave o endpoint. Si falla, muestra sugerencias integradas; puedes filtrar o escribir un ID. **Rellenar predeterminado** restablece el campo correspondiente.

## Idioma e instrucciones

El botón de traducción junto a la selección usa el idioma de destino y las instrucciones adicionales del modo avanzado, por ejemplo «Conserva la terminología técnica». El menú contextual y la traducción de páginas usan instrucciones guardadas del proveedor; no aplican esas instrucciones adicionales ni siguen siempre el idioma avanzado y pueden traducir al inglés.

## Razonamiento y comportamiento

En modo avanzado, **Override reasoning** permite elegir `none`, `minimal`, `low`, `medium`, `high` o `xhigh`, inicialmente `low`. Desactivado, usa el valor del proveedor. El modo básico no aplica la anulación. El modelo puede ignorar o rechazar niveles; más razonamiento puede aumentar coste y espera. La extensión no impone un límite de tokens de salida, pero el proveedor sí puede hacerlo.

Los controles avanzados incluyen el botón de selección, activado inicialmente; mantener ventanas abiertas, desactivado inicialmente; ocultación de datos sensibles, activada inicialmente; y depuración, desactivada inicialmente. Mantener ventanas permite varias traducciones. La ocultación reconoce correos, teléfonos, SSN estadounidenses y SIN canadienses, pero puede omitir datos. Los valores ocultados no se restauran en el texto traducido.

Ajustes y claves usan `chrome.storage.sync` y pueden sincronizarse entre dispositivos. Los registros pueden incluir claves y contenido incluso sin depuración. Consulta [Privacidad](/es/privacy).
