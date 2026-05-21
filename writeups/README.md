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

## Generador incluido

El repositorio incluye `scripts/build-writeups.mjs` para convertir Markdown exportado desde Obsidian a HTML estático compatible con el portafolio.

Uso básico:

```bash
npm run build:writeups
```

Por defecto lee archivos `.md` desde `writeups/md/` y escribe HTML en `writeups/`.

También puede copiar adjuntos desde tu vault de Obsidian:

```bash
node ./scripts/build-writeups.mjs --attachments "/ruta/a/Obsidian/Attachments"
```

Frontmatter soportado:

```markdown
---
title: Fluffy
slug: fluffy
lang: en
platform: Hack The Box
category: Active Directory
headline: Kerberoasting, Shadow Credentials and AD CS ESC16
difficulty: Medium
objective: Domain Admin
---
```

Embeds de Obsidian soportados:

```markdown
![[fluffy-nmap.png]]
![[fluffy-nmap.png|Initial scan]]
```

El script convierte esos embeds a rutas públicas bajo `src/images/writeups/<slug>/`.

## Por qué este enfoque

- Evita exponer rutas locales de Obsidian.
- Evita errores por imágenes faltantes.
- Mantiene el sitio rápido en GitHub Pages.
- Reduce riesgo de XSS: el HTML publicado debe generarse desde Markdown controlado, no desde contenido externo dinámico.

## Siguiente mejora natural

Conectar el generador con `src/data/content.en.json` para que el catálogo se actualice automáticamente cuando se agreguen nuevos Markdown.
