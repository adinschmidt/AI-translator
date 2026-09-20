# Privacidad

Actualizado el 20 de septiembre de 2026.

La extensión no tiene un servidor de traducción ni analítica del desarrollador. Envía texto seleccionado o regiones de la página e instrucciones directamente al endpoint configurado. Los proveedores remotos procesan esos datos según sus políticas; OpenRouter puede reenviarlos. Consultar modelos también envía solicitudes, posiblemente con tu clave, sin iniciar una traducción.

Las claves y ajustes usan `chrome.storage.sync`; el servicio del navegador puede copiarlos a otros dispositivos. No es almacenamiento exclusivamente local ni una caja fuerte independiente. No hay historial persistente de traducciones, pero los resultados permanecen en la página, ventanas y memoria temporal.

Ollama usa `http://localhost:11434` de forma predeterminada. Solo es local si servidor y modelo no reenvían solicitudes. Los endpoints personalizados reciben contenido y credenciales. HTTP no cifra el transporte; HTTPS sí.

La ocultación automática intenta reconocer correos, teléfonos, SSN y SIN antes de enviar contenido, pero puede fallar. Los atributos HTML entre comillas se sustituyen por marcadores y se restauran localmente. Los registros pueden contener claves, ajustes, texto original, metadatos y traducciones incluso sin depuración. La ocultación de solicitudes no limpia todos los registros.

`contextMenus` añade acciones; `scripting` inyecta scripts; `storage` guarda preferencias y claves. El acceso `https://*/*` y `http://*/*` permite actuar en páginas y contactar proveedores. Los scripts se ejecutan en marcos compatibles; la traducción completa empieza solo en el principal. ELD detecta idiomas localmente y DOMPurify se incluye en la extensión.

Puedes cambiar proveedor, borrar claves o datos de la extensión y detener una traducción. La sincronización puede conservar copias; detener no retira datos ya enviados. Revisa la política de tu proveedor y elimina datos privados antes de abrir una [incidencia](https://github.com/adinschmidt/AI-translator/issues).
