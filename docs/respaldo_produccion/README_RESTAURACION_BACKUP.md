# Guía Paso a Paso de Restauración de Copias de Seguridad — SGA

Este documento explica cómo verificar y restaurar de forma segura las copias de seguridad físicas de PostgreSQL (`.dump`) y cómo recuperar archivos desde la rama Git de respaldo del **Sistema de Gestión de Alquileres (SGA)**. Está redactado para que cualquier integrante del equipo pueda aplicarlo sin haber participado en las fases previas.

---

## A. Introducción

### 1. ¿Para qué sirve el respaldo físico de PostgreSQL?

Un respaldo físico/lógico en formato personalizado de PostgreSQL (`.dump`, generado con `pg_dump -Fc`) permite reconstruir el estado exacto de la base de datos en un instante determinado.

### 2. ¿Qué información contiene?

Cada archivo `.dump` generado en este proyecto contiene:
- La definición del esquema `public`: `8` tablas (`usuario`, `producto`, `alquiler`, `detalle_alquiler`, `logistica_alquiler`, `logistica_alquiler_alquiler`, `auditoria_sistema`, `alembic_version`).
- Objetos programables y de consulta: `1` vista (`vw_dashboard_operativo`), `12` funciones PL/pgSQL y `19` triggers de negocio y auditoría.
- Integridad y numeración: `5` secuencias, `26` índices y `92` restricciones (`PK`, `FK`, `UNIQUE`, `CHECK`, `NOT NULL`).
- Todos los registros existentes en las tablas al momento de tomar la copia, incluida la tabla `auditoria_sistema` y la revisión registrada en `alembic_version`.

### 3. ¿En qué situaciones puede utilizarse?

- **Verificación en entorno aislado:** restaurar en una base temporal para auditar conteos, esquema o integridad sin tocar entornos activos.
- **Recuperación ante incidentes (rollback de datos):** revertir la base de datos a su estado previo si una migración, carga masiva o cambio operativo falla tras confirmarse.
- **Aprovisionamiento local:** levantar una réplica fiel del estado respaldado para reproducir errores o ejecutar pruebas.

### 4. Diferencia entre un respaldo de PostgreSQL (`.dump`) y una rama de respaldo Git

| Aspecto | Respaldo de PostgreSQL (`.dump`) | Rama de respaldo Git (`backup/...`) |
|---|---|---|
| **Qué protege** | Estructura y datos reales/sintéticos almacenados dentro del motor PostgreSQL | Código fuente, scripts SQL versionados, migraciones y documentación del repositorio |
| **Herramienta** | `pg_dump` / `pg_restore` / `psql` | `git branch` / `git checkout` / `git restore` |
| **Dónde vive** | Fuera del repositorio Git (`<DIRECTORIO_BACKUPS>`) | En el historial del repositorio Git local y remoto |
| **¿Se sustituyen entre sí?** | **No.** Cambiar de rama en Git no restaura filas en PostgreSQL, y restaurar un `.dump` no revierte el código Python/TypeScript | **No.** Ambos respaldos son complementarios y obligatorios |

---

## B. Ubicación de las copias de seguridad

Los archivos `.dump` se almacenan **exclusivamente fuera del repositorio Git**, en el directorio dedicado de respaldos de la estación de trabajo o servidor autorizado (representado en esta guía como `<DIRECTORIO_BACKUPS>`, por ejemplo `C:\RespaldosSGA\` o `/var/backups/sga/`).

> [!IMPORTANT]
> **Los archivos `.dump` nunca deben copiarse dentro del repositorio ni subirse a Git.** Tampoco deben publicarse rutas personales con nombres de usuario del sistema operativo ni cadenas de conexión con credenciales.

### Catálogo de respaldos registrados durante el proyecto

| Identificador del archivo (`<ARCHIVO_BACKUP>`) | Base de origen | Estado capturado | Tamaño (bytes) | Entradas TOC (`pg_restore -l`) | SHA-256 registrado |
|---|---|---|---:|---:|---|
| `sga_db_previo_20261126_210134.dump` | `sga_db` (local) | Estado local previo a limpieza y poblamiento demo | `59119` | `101` | `90c05df5a9f22000b5b9ac065a755770869cf6ffd811cd6254e7c164226e709c` |
| `sga_db_final_demo_20261126_210652.dump` | `sga_db` (local) | Estado local poblado y validado con datos demo (`14/10/8/20/14/14/97/1`) | `60161` | `101` | `679913dbc14f55d05091874466159ba280507abe691c96cd475b69ce42270b60` |
| `sga_db_mydd_previo_carga_20261127_091347.dump` | `sga_db_mydd` (producción) | Respaldo 1 del estado previo de producción (`22/7/6/6/9/9/12/1`) durante inspección | `58726` | `102` | `0d5b35e6e5a5d40e8811323cfb73f287ccbc3d9540b0bbc4aa8af571c1d4f3c2` |
| `sga_db_mydd_previo_carga_20261127_094023.dump` | `sga_db_mydd` (producción) | Respaldo 2 del estado previo de producción (`22/7/6/6/9/9/12/1`) previo a la carga autorizada | `58726` | `102` | `c6bd1db2b8656bad26a44ca8282560e22995bd9ab9db9249b3ccd1fb4157c242` |

---

## C. Requisitos previos

Antes de iniciar cualquier restauración, asegúrate de contar con:

1. **Motor PostgreSQL compatible:** los respaldos fueron generados con herramientas cliente `PostgreSQL 18.4` a partir de servidores `PostgreSQL 18.4` (local) y `PostgreSQL 18.6` (producción). El servidor de destino debe ejecutar PostgreSQL `18.x` (o una versión cuyo formato de catálogo y protocolo sea compatible con `pg_restore` 18).
2. **Herramientas de línea de comandos instaladas:** `pg_restore`, `pg_dump` y `psql` disponibles en el `PATH` o en el directorio `bin` de la instalación de PostgreSQL.
3. **Acceso autorizado al servidor de destino:** host (`<HOST_DB>`), puerto (`<PUERTO_DB>`), usuario con permisos de creación/escritura en la base de destino (`<USUARIO_DB>`) y contraseña suministrada de forma segura en sesión (por ejemplo mediante prompt interactivo o variable de entorno efímera `PGPASSWORD`, nunca escrita en scripts versionados).
4. **Archivo de respaldo válido (`<ARCHIVO_BACKUP>`):** accesible en disco local con espacio libre suficiente (al menos 10 veces el tamaño del archivo `.dump`).
5. **Confirmación explícita de la base de destino (`<BASE_DESTINO>`):** verificar dos veces que no se apunta por error a una base productiva activa cuando se desea hacer una prueba.

---

## D. Procedimiento de restauración paso a paso

Utiliza los siguientes marcadores genéricos al adaptar los comandos a tu entorno:
- `<DIRECTORIO_BACKUPS>`: carpeta fuera del repositorio donde residen los `.dump` (p. ej. `C:\RespaldosSGA`).
- `<ARCHIVO_BACKUP>`: ruta completa al archivo `.dump` elegido.
- `<HOST_DB>`: host del servidor PostgreSQL destino (p. ej. `localhost`).
- `<PUERTO_DB>`: puerto del servidor PostgreSQL destino (p. ej. `5432`).
- `<USUARIO_DB>`: usuario de conexión autorizado.
- `<BASE_DESTINO>`: nombre de la base de datos donde se restaurará el respaldo (para pruebas aisladas, usar un nombre temporal nuevo como `sga_restore_test_tmp`).

### Paso 1. Identificar el archivo de respaldo correcto

Selecciona en la tabla de la sección **B** el archivo que corresponde al punto en el tiempo que necesitas recuperar.

### Paso 2. Verificar que el archivo existe y que su tamaño es mayor que cero

En PowerShell (Windows):

```powershell
Get-Item "<DIRECTORIO_BACKUPS>\<ARCHIVO_BACKUP>" | Select-Object Name, Length, LastWriteTime
```

En Bash (Linux / macOS):

```bash
ls -lh "<DIRECTORIO_BACKUPS>/<ARCHIVO_BACKUP>"
```

Comprueba que `Length` coincida con el tamaño en bytes documentado en la sección **B** y sea mayor que `0`.

### Paso 3. Comprobar la integridad mediante SHA-256

Calcula el hash SHA-256 del archivo y compáralo con el valor registrado en la tabla de la sección **B**:

En PowerShell:

```powershell
Get-FileHash -Algorithm SHA256 "<DIRECTORIO_BACKUPS>\<ARCHIVO_BACKUP>" | Format-List
```

En Bash:

```bash
sha256sum "<DIRECTORIO_BACKUPS>/<ARCHIVO_BACKUP>"
```

> [!WARNING]
> Si el hash SHA-256 no coincide exactamente con el valor registrado, **no utilices el archivo para sobrescribir ninguna base existente**; el archivo podría estar truncado o alterado.

### Paso 4. Inspeccionar el catálogo interno con `pg_restore -l`

Verifica que el catálogo TOC (`Table of Contents`) del archivo `.dump` sea legible:

```powershell
pg_restore -l "<DIRECTORIO_BACKUPS>\<ARCHIVO_BACKUP>"
```

La ejecución debe finalizar con código de salida `0` y listar las tablas, secuencias, funciones, vista, triggers y bloques `TABLE DATA` (`101` elementos para los respaldos locales o `102` elementos para los respaldos de producción).

### Paso 5. Confirmar el servidor y la base de destino

Antes de crear o modificar `<BASE_DESTINO>`, conéctate al servidor para confirmar a qué instancia estás apuntando:

```powershell
psql -h <HOST_DB> -p <PUERTO_DB> -U <USUARIO_DB> -d postgres -c "SELECT current_database(), inet_server_addr(), inet_server_port(), version();"
```

### Paso 6. Crear una base de destino aislada (obligatorio en pruebas y validaciones previas)

Siempre que realices una restauración de prueba o verificación previa, crea una base temporal limpia en el entorno local:

```powershell
psql -h <HOST_DB> -p <PUERTO_DB> -U <USUARIO_DB> -d postgres -c "CREATE DATABASE <BASE_DESTINO>;"
```

### Paso 7. Restaurar el respaldo utilizando `pg_restore`

Ejecuta `pg_restore` usando `--no-owner --no-privileges` (para evitar errores por diferencias de nombres de rol entre Render y el entorno local) y `--exit-on-error` (para detenerse ante cualquier fallo):

```powershell
pg_restore -Fc --no-owner --no-privileges --exit-on-error -h <HOST_DB> -p <PUERTO_DB> -U <USUARIO_DB> -d <BASE_DESTINO> "<DIRECTORIO_BACKUPS>\<ARCHIVO_BACKUP>"
```

### Paso 8. Comprobar que la restauración terminó correctamente

Verifica inmediatamente el código de salida del comando:
- En PowerShell: `Write-Output $LASTEXITCODE` (debe ser `0`).
- En Bash: `echo $?` (debe ser `0`).

### Paso 9. Verificar tablas, registros, funciones, triggers, vistas y restricciones

Ejecuta una consulta de inventario estructural sobre `<BASE_DESTINO>`:

```powershell
psql -h <HOST_DB> -p <PUERTO_DB> -U <USUARIO_DB> -d <BASE_DESTINO> -c "
SELECT
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') AS tablas,
  (SELECT count(*) FROM pg_views WHERE schemaname = 'public') AS vistas,
  (SELECT count(*) FROM information_schema.sequences WHERE sequence_schema = 'public') AS secuencias,
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public') AS funciones,
  (SELECT count(*) FROM pg_trigger tg JOIN pg_class c ON c.oid = tg.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND NOT tg.tgisinternal) AS triggers,
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') AS indices,
  (SELECT count(*) FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = con.connamespace WHERE n.nspname = 'public') AS restricciones;
"
```

Resultado estructural esperado en todos los respaldos del proyecto:
- `tablas = 8`, `vistas = 1`, `secuencias = 5`, `funciones = 12`, `triggers = 19`, `indices = 26`, `restricciones = 92`.

### Paso 10. Ejecutar las validaciones de integridad disponibles

Ejecuta el script de validación de solo lectura incluido en el repositorio:

```powershell
psql -h <HOST_DB> -p <PUERTO_DB> -U <USUARIO_DB> -d <BASE_DESTINO> -v ON_ERROR_STOP=1 -f "docs/respaldo_produccion/scripts/03_validacion_produccion.sql"
```

Comprueba:
- Conteos por tabla coherentes con el respaldo elegido:
  - Si restauraste un respaldo **previo de producción** (`sga_db_mydd_previo_carga_*.dump`): `usuario=22`, `producto=7`, `alquiler=6`, `detalle_alquiler=6`, `logistica_alquiler=9`, `logistica_alquiler_alquiler=9`, `auditoria_sistema=12`, `alembic_version=1` (`0001_initial_schema`).
  - Si restauraste el respaldo **final demo local** (`sga_db_final_demo_20261126_210652.dump`): `usuario=14`, `producto=10`, `alquiler=8`, `detalle_alquiler=20`, `logistica_alquiler=14`, `logistica_alquiler_alquiler=14`, `auditoria_sistema=97`, `alembic_version=1` (`d4f74f3d4896`).
- `0` registros huérfanos en las `7` llaves foráneas.
- Funcionamiento de la vista `SELECT * FROM public.vw_dashboard_operativo;`.

### Paso 11. Documentar el resultado (y limpiar la base temporal si fue una prueba)

Registra fecha, hora, nombre del archivo restaurado, SHA-256 verificado, base destino y conteos obtenidos. Si `<BASE_DESTINO>` fue una base temporal de prueba (por ejemplo `sga_restore_test_tmp`), elimínala tras concluir la verificación:

```powershell
psql -h <HOST_DB> -p <PUERTO_DB> -U <USUARIO_DB> -d postgres -c "DROP DATABASE IF EXISTS sga_restore_test_tmp;"
```

---

## E. Recuperación sobre una base existente

> [!CAUTION]
> **ADVERTENCIA CRÍTICA:** Restaurar un respaldo sobre una base de datos existente (`sga_db` o `sga_db_mydd`) utilizando opciones como `--clean` o vaciando tablas previamente **sobrescribirá y eliminará de forma irreversible cualquier registro creado después de la fecha del respaldo**. Nunca ejecutes una restauración sobre una base existente sin seguir los cuatro controles obligatorios siguientes.

Antes de restaurar sobre una base existente debes cumplir obligatoriamente:

1. **Crear un respaldo adicional del estado actual (pre-rollback):**
   ```powershell
   pg_dump -Fc --no-owner --no-privileges -h <HOST_DB> -p <PUERTO_DB> -U <USUARIO_DB> -d <BASE_DESTINO> -f "<DIRECTORIO_BACKUPS>\<BASE_DESTINO>_pre_restauracion_YYYYMMDD_HHMMSS.dump"
   ```
2. **Realizar primero la restauración en una base temporal aislada** (Pasos 6 a 10 de la sección **D**) para confirmar que el archivo `.dump` restaura sin errores.
3. **Confirmar expresamente la identidad de `<BASE_DESTINO>`** y detener las conexiones activas de la aplicación para evitar escrituras concurrentes durante la ventana de mantenimiento.
4. **Contar con autorización expresa documentada** del responsable del proyecto antes de ejecutar `pg_restore --clean --if-exists` sobre la base destino.

---

## F. Diferencia entre recuperación de base de datos y recuperación de código

Si lo que necesitas recuperar es **código fuente, scripts SQL o documentación** al estado respaldado durante este cierre, debes utilizar la rama Git de respaldo:

`backup/sga-antes-carga-produccion-2026-11-27`

*(También existe la rama previa `backup/sga-antes-estabilizacion-2026-11-27` en el commit `d5496b1091df4ea039324d7ed7f2c1abeb026a61`.)*

### 1. Consultar el historial de la rama de respaldo sin cambiar tu rama actual

```bash
git log --oneline --stat backup/sga-antes-carga-produccion-2026-11-27 -n 10
```

### 2. Inspeccionar el contenido de un archivo en la rama de respaldo sin tocar tu directorio de trabajo

```bash
git show backup/sga-antes-carga-produccion-2026-11-27:<RUTA_RELATIVA_ARCHIVO>
```

### 3. Crear una rama de trabajo nueva a partir del respaldo (sin sobrescribir tu rama actual)

```bash
git switch -c <NUEVA_RAMA_RECUPERACION> backup/sga-antes-carga-produccion-2026-11-27
```

### 4. Recuperar un archivo específico hacia tu rama actual (verificando antes `git status`)

Comprueba primero con `git status` que no tengas cambios sin guardar en ese archivo y luego ejecuta:

```bash
git restore --source=backup/sga-antes-carga-produccion-2026-11-27 -- <RUTA_RELATIVA_ARCHIVO>
```

---

## G. Limitaciones y advertencias

1. **Una rama Git no contiene los respaldos físicos de PostgreSQL:** clonar o hacer checkout de `backup/sga-antes-carga-produccion-2026-11-27` no restaura automáticamente ninguna base de datos.
2. **Custodia externa de los archivos `.dump`:** los archivos `.dump` residen fuera del repositorio Git (`<DIRECTORIO_BACKUPS>`). Su conservación depende del almacenamiento seguro de dichos archivos y de verificar su hash SHA-256 antes de usarlos.
3. **Configuración de la aplicación:** restaurar la base de datos no configura por sí solo las variables de entorno del backend (`sga_backend_jwt/.env`: `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`) ni del frontend (`sga_frontend_jwt/.env`: `VITE_API_URL`).
4. **Compatibilidad de versiones PostgreSQL y migraciones Alembic:**
   - Los respaldos de este proyecto provienen de PostgreSQL `18.4` (local) y `18.6` (Render), mientras que `docker-compose.yml` declara `postgres:16-alpine` (hallazgo `H-DB-07`). Un archivo `.dump` en formato custom generado con `pg_dump 18.x` debe restaurarse con `pg_restore 18.x` sobre un servidor PostgreSQL `18.x`.
   - En los respaldos de `sga_db` local, `alembic_version` contiene `d4f74f3d4896` (`H-DB-01`), mientras que en `sga_db_mydd` contiene `0001_initial_schema`. Además, las `12` funciones, `19` triggers y la vista `vw_dashboard_operativo` están incluidos dentro del `.dump`, pero no en la migración Alembic `0001_initial_schema.py` (`H-DB-02`).
5. **Prueba obligatoria previa:** toda restauración debe probarse primero en una base temporal aislada antes de aplicarse como recuperación definitiva sobre un entorno compartido o de producción.
