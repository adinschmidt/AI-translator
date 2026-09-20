# Solución de problemas

- Carga `dist/chrome/` o `dist/firefox/manifest.json`, no el código fuente. Firefox requiere 142 o posterior. Recarga extensión y página tras recompilar; comprueba la confirmación de guardado.
- Para errores de endpoint, usa una URL completa y restablece el valor predeterminado. Usa HTTPS en servicios remotos. Para 401/403, comprueba clave, permisos y facturación.
- Actualiza modelos o escribe un ID disponible para tu cuenta. Si falla el razonamiento, desactiva la anulación. Ante «API returned no translation text», prueba otro modelo o menos texto. Algunas respuestas vacías se reintentan sin streaming.
- Ante límites de cuota, espera o cambia de modelo. Las páginas requieren varias solicitudes y los reintentos incluyen espera. **Detener** cancela la ejecución activa.
- Para Ollama, inicia el servidor, descarga un modelo con `ollama pull llama3.2` y usa `http://localhost:11434`. Si rechaza el origen, configura `OLLAMA_ORIGINS` y reinicia. `OLLAMA_ORIGINS="*" ollama serve` permite todos los orígenes.
- Si falta el botón, revisa el ajuste, el idioma detectado y el destino. Para aplicar el idioma avanzado y las instrucciones adicionales, usa el botón junto a la selección. Recarga si la página queda parcialmente traducida.

La depuración añade detalles de errores. Las consolas de la extensión y de la página pueden contener claves y texto incluso sin depuración. Elimina datos sensibles antes de compartir registros.
