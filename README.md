# CV Online - Daniel Felipe Galindo Arias

CV online estilo Offensive Portfolio (Opcion 3), preparado para GitHub Pages y migracion a dominio propio.

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
- package.json
```

## Despliegue en GitHub Pages

1. Crea el repo `<usuario>.github.io` o un repo normal para Pages.
2. Sube este proyecto a la rama `main`.
3. Activa GitHub Pages con `GitHub Actions` como source.
4. El workflow `Deploy CV to GitHub Pages` publicara el sitio.

## Migracion a dominio propio

1. Crea archivo `CNAME` con tu dominio (ej. `cv.tudominio.com`).
2. Configura DNS:
   - `CNAME` de `cv` apuntando a `<usuario>.github.io`
3. Habilita HTTPS en GitHub Pages.

## Integracion con Hack The Box

La integracion se hace **server-side** (workflow o local), nunca en cliente.

## Rotacion de token HTB (obligatorio)

1. Inicia sesion en Hack The Box.
2. Ve a tu configuracion de cuenta y busca la seccion de API tokens/personal access tokens.
3. Revoca el token expuesto.
4. Crea un token nuevo con permisos minimos necesarios (principio de menor privilegio).
5. Guarda ese token solo en un gestor seguro (no en notas publicas, chat o commits).

### Secrets y variables requeridas

- GitHub Secret: `HTB_API_TOKEN`
- GitHub Variable: `HTB_USER_ID` (ejemplo: `886162`)

## Como cargar HTB_API_TOKEN en GitHub (paso a paso)

1. Abre tu repositorio en GitHub.
2. Entra a `Settings` > `Secrets and variables` > `Actions`.
3. En `Secrets`, click en `New repository secret`.
4. Name: `HTB_API_TOKEN`.
5. Secret: pega el token nuevo de HTB.
6. Guarda con `Add secret`.
7. En la pestaña `Variables`, crea `HTB_USER_ID` con valor `886162`.

## Ejecutar sincronizacion HTB desde GitHub

1. Ve a `Actions`.
2. Abre workflow `Sync HTB Stats`.
3. Click en `Run workflow`.
4. Si todo sale bien, se actualiza `src/data/htb.json` y se hace commit automatico.

## Verificacion rapida de seguridad

- Verifica que no exista `.env` en commits.
- Verifica que el token no aparezca en `src/` ni en `README.md`.
- Si el token se vuelve a filtrar, revoca y rota de inmediato.

### Ejecucion local

```bash
cp .env.example .env
# completa HTB_API_TOKEN y HTB_USER_ID
export $(grep -v '^#' .env | xargs)
node ./scripts/sync-htb.mjs
```

## Parametros de seguridad aplicados

- No se almacena token HTB en archivos versionados.
- `.env` y variantes se excluyen por `.gitignore`.
- El frontend consume solo `src/data/htb.json` ya saneado.
- El script de sincronizacion preserva fallback seguro si falla la API.

## Nota importante

Si un token fue expuesto en chat, commit o issue, debes **revocarlo y regenerarlo** antes de continuar.
