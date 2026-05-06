# CV Online - Daniel Felipe Galindo Arias

CV online estilo Offensive Portfolio (Opción 3), preparado para GitHub Pages y migración a dominio propio.

## Estructura

```text
.
- .github/workflows/
- scripts/
- src/
  - data/
  - js/
  - styles/
- .env.example
- .gitignore
- index.html
- writeups.html
- scripts.html
- exploits.html
- recursos.html
- package.json
```

## Secciones del portafolio

- `index.html`: perfil profesional, métricas, experiencia y destacados.
- `writeups.html`: biblioteca de writeups técnicos.
- `scripts.html`: automatizaciones y utilidades de seguridad.
- `exploits.html`: pruebas de concepto y explotación controlada.
- `recursos.html`: plantillas, guías y material de estudio.
- `src/data/content.json`: fuente de contenido de las páginas adicionales.

## Cómo subir nuevos writeups

1. Abre `src/data/content.json`.
2. Busca el arreglo `writeups`.
3. Agrega un nuevo objeto con este formato:

```json
{
  "title": "Writeup HTB: Nombre de la máquina",
  "date": "2026-05-06",
  "platform": "Hack The Box",
  "summary": "Resumen técnico breve del vector inicial y la escalada de privilegios.",
  "tags": ["Linux", "Web", "PrivEsc"],
  "url": "https://tu-enlace-del-writeup"
}
```

4. Guarda el archivo y verifica localmente en `writeups.html`.
5. Haz commit y push: GitHub Pages publicará automáticamente el cambio.

Notas:
- Si aún no tienes URL pública del writeup, deja `"url": "#"` temporalmente.
- Si el writeup estará en este mismo repo (por ejemplo Markdown convertido a HTML), usa esa ruta local en `url`.

## Despliegue en GitHub Pages

1. Crea el repo `<usuario>.github.io` o un repo normal para Pages.
2. Sube este proyecto a la rama `main`.
3. Activa GitHub Pages con `GitHub Actions` como source.
4. El workflow `Deploy CV to GitHub Pages` publicará el sitio.

## Migración a dominio propio

1. Crea archivo `CNAME` con tu dominio (ej. `cv.tudominio.com`).
2. Configura DNS:
   - `CNAME` de `cv` apuntando a `<usuario>.github.io`
3. Habilita HTTPS en GitHub Pages.

## Integración con Hack The Box

La integración se hace **server-side** (workflow o local), nunca en cliente.

## Rotación de token HTB (obligatorio)

1. Inicia sesión en Hack The Box.
2. Ve a tu configuración de cuenta y busca la sección de API tokens/personal access tokens.
3. Revoca el token expuesto.
4. Crea un token nuevo con permisos mínimos necesarios (principio de menor privilegio).
5. Guarda ese token solo en un gestor seguro (no en notas públicas, chat o commits).

### Secrets y variables requeridas

- GitHub Secret: `HTB_API_TOKEN`
- GitHub Variable: `HTB_USER_ID` (ejemplo: `886162`)

## Cómo cargar HTB_API_TOKEN en GitHub (paso a paso)

1. Abre tu repositorio en GitHub.
2. Entra a `Settings` > `Secrets and variables` > `Actions`.
3. En `Secrets`, click en `New repository secret`.
4. Name: `HTB_API_TOKEN`.
5. Secret: pega el token nuevo de HTB.
6. Guarda con `Add secret`.
7. En la pestaña `Variables`, crea `HTB_USER_ID` con valor `886162`.

## Ejecutar sincronización HTB desde GitHub

1. Ve a `Actions`.
2. Abre workflow `Sync HTB Stats`.
3. Click en `Run workflow`.
4. Si todo sale bien, se actualiza `src/data/htb.json` y se hace commit automático.

## Verificación rápida de seguridad

- Verifica que no exista `.env` en commits.
- Verifica que el token no aparezca en `src/` ni en `README.md`.
- Si el token se vuelve a filtrar, revoca y rota de inmediato.

### Ejecución local

```bash
cp .env.example .env
# completa HTB_API_TOKEN y HTB_USER_ID
export $(grep -v '^#' .env | xargs)
node ./scripts/sync-htb.mjs
```

## Parámetros de seguridad aplicados

- No se almacena token HTB en archivos versionados.
- `.env` y variantes se excluyen por `.gitignore`.
- El frontend consume solo `src/data/htb.json` ya saneado.
- El script de sincronización preserva fallback seguro si falla la API.

## Nota importante

Si un token fue expuesto en chat, commit o issue, debes **revocarlo y regenerarlo** antes de continuar.
