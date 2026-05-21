# Writeups desde Obsidian

El sitio ya no se rompe visualmente si falta una imagen: las páginas HTML de writeups reemplazan imágenes inexistentes por un aviso de evidencia pendiente.

## Flujo recomendado

1. Mantener Obsidian como fuente original de notas.
2. Exportar o copiar cada writeup Markdown al repositorio con nombre estable, por ejemplo `writeups/md/fluffy.md`.
3. Copiar los adjuntos de Obsidian a `src/images/writeups/<slug>/`.
4. Reescribir embeds de Obsidian como rutas web normales:
   - Obsidian: `![[fluffy-nmap.png]]`
   - Web: `![Escaneo inicial](/src/images/writeups/fluffy/fluffy-nmap.png)`
5. Generar HTML estático desde Markdown antes de publicar, en lugar de renderizar Markdown arbitrario en el navegador.

## Por qué este enfoque

- Evita exponer rutas locales de Obsidian.
- Evita errores por imágenes faltantes.
- Mantiene el sitio rápido en GitHub Pages.
- Reduce riesgo de XSS: el HTML publicado debe generarse desde Markdown controlado, no desde contenido externo dinámico.

## Siguiente mejora natural

Crear un script `scripts/build-writeups.mjs` que lea Markdown exportado desde Obsidian, copie imágenes, normalice rutas y genere las páginas HTML finales automáticamente.
