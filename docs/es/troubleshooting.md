# Solución de problemas

## "URL de punto final de API no válida" en la configuración

Asegúrese de que el punto final comience con `https://` (o `http://` para Ollama local)
y es una URL completa. Utilice **Rellenar valor predeterminado** para restaurar el valor recomendado.

## Errores 401/403

- Vuelva a verificar la clave API en la configuración.
- Confirme que la clave esté activa en la consola del proveedor.
- Algunos proveedores requieren que se habilite la facturación antes de poder utilizar las claves.

## Límites de tarifas o errores de cuota

Los proveedores pueden limitar o bloquear las solicitudes si excede los límites de su plan.
Vuelva a intentarlo más tarde o actualice su plan de proveedor.

## Los modelos Ollama no se cargan

- Confirme que Ollama se esté ejecutando: `ollama serve`.
- Configure `OLLAMA_ORIGINS="*"` y reinicie para permitir solicitudes de extensión.
- Utilice el punto final predeterminado `http://localhost:11434`.

## La traducción de página completa parece rota

La traducción de página completa es experimental. Si el diseño de una página se rompe, vuelve a cargar la pestaña
para restaurar el contenido original e intente traducir una selección más pequeña.

## La extensión no responde

- Recargar la extensión en `chrome://extensions/` o `about:debugging`.
- Vuelva a abrir la página **Opciones** y asegúrese de que la configuración esté guardada.
