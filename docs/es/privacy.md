# Política de privacidad para AI Translator

**Última actualización:** 10 de enero de 2026

## 1. Descripción general

AI Translator ("nosotros", "nuestro" o "la extensión") es una extensión del navegador del lado del cliente
que permite a los usuarios traducir texto utilizando sus propias claves API AI. la extensión
opera completamente dentro de su navegador y no transmite datos a ningún servidor
propiedad o operado por el desarrollador.

**Esto no es un consejo legal.** Esta política describe cómo maneja la extensión
datos para ayudarle a tomar una decisión informada sobre su uso.

## 2. Recopilación y almacenamiento de datos

- **Datos personales:** Nosotros (el desarrollador) no recopilamos, almacenamos ni tenemos acceso a
  cualquier dato personal, texto traducido o historial de navegación.
- **Claves API:** Sus claves API se almacenan exclusivamente en su dispositivo mediante el
  almacenamiento sincronizado del navegador (`browser.storage.sync`). Esto significa que tu
  La configuración se sincroniza en todos sus navegadores cuando inicia sesión, pero nunca se actualiza.
  transmitido al desarrollador o a cualquier tercero que no sea la IA específica
  proveedor que elija para las solicitudes de traducción.
- **Sin servidor backend:** Esta extensión no opera un servidor backend. Todos
  el procesamiento ocurre localmente en su navegador.

## 3. Intercambio de datos con terceros

Para funcionar, esta extensión envía el texto que seleccionas explícitamente para traducir.
directamente desde su navegador al proveedor de IA que haya configurado. Al usar
esta extensión, usted reconoce que sus datos están sujetos a la privacidad
políticas de estos proveedores:

| Proveedor            | Política de privacidad                                                             |
| -------------------- | ---------------------------------------------------------------------------------- |
| **OpenAI**           | [https://openai.com/privacy](https://openai.com/privacy)                           |
| **Anthropic**        | [https://www.anthropic.com/legal/privacy](https://www.anthropic.com/legal/privacy) |
| **Google (Gemini)** | [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms)   |
| **xAI (Grok)**       | [https://x.ai/legal/privacy-policy](https://x.ai/legal/privacy-policy)             |
| **OpenRouter**       | [https://openrouter.ai/privacy](https://openrouter.ai/privacy)                     |
| **Ollama (Local)**   | Los datos permanecen en su máquina local; sin transmisión externa.                 |

**Consideraciones importantes:**

- Algunos proveedores pueden utilizar sus datos para entrenar sus modelos a menos que usted opte por no participar
  (consulte la política de cada proveedor).
- OpenRouter enruta solicitudes a varios proveedores de IA subyacentes, cada uno con sus
  propias políticas de datos.
- No vendemos, comercializamos ni transferimos de otro modo sus datos a terceros.

## 4. Políticas de la tienda del navegador

Cuando se distribuye a través de tiendas de extensiones de navegador, esta extensión cumple con los
políticas de datos de usuario aplicables, incluidas [Chrome Web Store Política de datos de usuario](https://developer.chrome.com/docs/webstore/program-policies/) y [Políticas de complementos de Firefox](https://extensionworkshop.com/documentation/publish/add-on-policies/).

## 5. Explicación de permisos

Esta extensión solicita los siguientes permisos:

| Permiso                           | Propósito                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `contextMenus`                    | Agrega la opción "Traducir" al menú contextual                                                                                 |
| `scripting`                       | Inyecta la superposición de la interfaz de usuario de traducción en páginas web                                                |
| `storage`                         | Guarda sus claves API y preferencias localmente                                                                                |
| `host_permissions` (`<all_urls>`) | Necesario para mostrar traducciones en cualquier página web que visite y para realizar llamadas API al proveedor de IA elegido |

## 6. Control de usuario

- **Eliminación:** Puede eliminar todos los datos almacenados por esta extensión desinstalando

la extensión o borrar los datos de la extensión de su navegador.

- **Exclusión voluntaria:** No se envían datos a proveedores de IA a menos que usted active explícitamente una
  acción de traducción.
- **Elección de proveedor:** Usted controla qué proveedor de IA recibe sus datos mediante
  seleccionándolo en la configuración de la extensión.

## 7. Seguridad

- Las claves API se almacenan en el almacenamiento seguro del navegador y solo se transmiten
  a través de HTTPS a los puntos finales del proveedor de IA.
- La extensión no registra, almacena en caché ni retiene ningún texto traducido después
  mostrándolo.

## 8. Cambios a esta política

Podemos actualizar esta política de privacidad de vez en cuando. Los cambios se reflejarán
en la fecha de "Última actualización" en la parte superior de este documento.

## 9. Contacto

Si tiene preguntas sobre esta política, abra un issue en el
[repositorio de GitHub](https://github.com/adinschmidt/AI-translator/issues).

---

_Esta extensión es de código abierto. Puedes revisar el código para verificar esta privacidad.
reclamaciones._
