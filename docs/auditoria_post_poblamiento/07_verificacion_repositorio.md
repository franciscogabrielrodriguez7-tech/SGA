# 07 — Verificación del repositorio

> **Fecha:** 2026-11-26  
> **Repositorio examinado:** `C:\Users\Acer\Documents\Default Project\SGA_repo\SGA` (raíz que contiene `AGENTS.md`)  
> **Origen:** `OP` = verificado personalmente por OpenCode · `AG` = declarado por Antigravity

---

## 1. Línea base Git

| Verificado | Procedimiento | Resultado obtenido | Resultado esperado | Estado |
|---|---|---|---|---|
| Raíz del repositorio | `git rev-parse --show-toplevel` | `C:/Users/Acer/Documents/Default Project/SGA_repo/SGA` | Raíz con `AGENTS.md` | **aprobado** |
| Rama | `git branch --show-current` | `feat/taller-6-calidad-sqa` | Sin cambio de rama | **aprobado** |
| HEAD | `git rev-parse HEAD` | `cd4a48590334675569409f197f446679065974ab` | Igual que la auditoría inicial | **aprobado** |
| Padre de HEAD | `git rev-parse HEAD^` | `599f96fd28e282725e6a325604e8ddaa0b8850b5` | Sin nuevos commits | **aprobado** |
| Seguimiento remoto | `git status --short --branch` | `## feat/taller-6-calidad-sqa...origin/feat/taller-6-calidad-sqa` | Consistente | **aprobado** |

No se ejecutaron `add`, `commit`, `push`, `fetch`, `merge`, `reset`, `restore` ni cambios de rama.

---

## 2. Modificaciones

| Verificado | Procedimiento | Resultado obtenido | Resultado esperado | Estado |
|---|---|---|---|---|
| Cambios en el árbol de trabajo | `git diff --name-status HEAD` | Vacío | Vacío | **aprobado** |
| Cambios en el índice | `git diff --cached --name-status` | Vacío | Vacío | **aprobado** |
| Código fuente modificado | Ídem, revisión de rutas | Ninguno | Ninguno | **aprobado** |
| Migraciones modificadas | Ídem sobre `sga_backend_jwt/alembic/` | Ninguno | Ninguno | **aprobado** |
| Configuración modificada | Ídem sobre `docker-compose.yml`, `.env*`, `settings.py` | Ninguno | Ninguno | **aprobado** |

Estado inicial y final del árbol versionado: sin modificaciones. La única novedad es la carpeta de documentos de auditoría creada por encargo expreso del usuario (`docs/auditoria_post_poblamiento/`), que aparecerá como no versionada al cierre.

---

## 3. Archivos `.dump`

| Verificado | Procedimiento | Resultado obtenido | Resultado esperado | Estado |
|---|---|---|---|---|
| Dumps versionados | `git ls-files '*.dump'` | Ninguno | Ninguno | **aprobado** |
| Dumps en el árbol de trabajo | `Get-ChildItem -Recurse -Filter *.dump` excluyendo `.git` | Ninguno | Ninguno | **aprobado** |
| Respaldos fuera del repositorio | Listado de `C:\RespaldosSGA\` | 2 archivos, ambos fuera del repo | Fuera del repo | **aprobado** |

---

## 4. Documentos y scripts generados

| Verificado | Procedimiento | Resultado obtenido | Resultado esperado | Estado |
|---|---|---|---|---|
| Documentos de implementación presentes | Listado de `docs/implementacion_datos_demo/` | Solo `01_resumen_implementacion.md`, `02_respaldo_previo.md`, `04_datos_demo_insertados.md` | 9 documentos | **fallido** |
| Documentos ausentes | Diferencia del listado | `03`, `05`, `06`, `07`, `08`, `09` | Ninguno ausente | **fallido** |
| Scripts SQL presentes | Listado de `docs/implementacion_datos_demo/scripts/` | `01_limpieza_sga_db.sql`, `02_poblamiento_demo_sga_db.sql`, `03_validacion_sga_db.sql` | 3 scripts | **aprobado** |
| Scripts no ejecutados por OpenCode | Declaración de operaciones | Inspeccionados como texto; ninguno ejecutado | No ejecutar | **aprobado** |
| Documentación de auditoría inicial | Listado de `docs/auditoria_base_datos_produccion/` | 11 archivos presentes | 11 archivos | **aprobado** |

---

## 5. Credenciales, hashes y datos sensibles

Procedimiento (`OP`): escaneo de 249 archivos no ignorados (`git ls-files --cached --others --exclude-standard`) con regex para hashes bcrypt, asignaciones de secretos y un literal de contraseña demo. **No se imprimieron valores coincidentes.**

| Verificado | Resultado obtenido | Interpretación | Estado |
|---|---|---|---|
| Hashes bcrypt en documentos/scripts generados | 0 | Antigravity no escribió hashes en la documentación nueva ni en los SQL del poblamiento | **aprobado** |
| Hashes bcrypt en archivos versionados preexistentes | 12 en `database/01_esquema/03_seed_data.sql` y `database/01_esquema/04_plantillas.sql` | Condición preexistente del repositorio, no introducida por el poblamiento; relacionada con hallazgos históricos de exposición de hashes | **observado** |
| Asignaciones `DATABASE_URL` / `JWT_SECRET_KEY` y análogas | Presentes en archivos `.example`, documentación y código que lee variables | Son plantillas o referencias a variables de entorno; no se incorporaron valores reales nuevos | **aprobado** |
| `sga_backend_jwt/.env` | Existe pero está ignorado por `.gitignore:223` | No forma parte del repositorio; no se imprimió su contenido | **aprobado** |
| Literal de contraseña demo en documentos generados | 2 coincidencias (`01` y `04` de implementación) | Se omite el valor en este informe; es una credencial sintética de prueba, no un secreto de despliegue | **observado** |

---

## 6. Observación fuera de la fuente de verdad

El directorio superior `C:\Users\Acer\Documents\Default Project` es otro repositorio Git: muestra archivos históricos como eliminados y `SGA_repo/` como no versionado. Según `AGENTS.md`, la fuente de verdad es la raíz que contiene dicho archivo, es decir `SGA_repo/SGA`. Esta auditoría no modificó ese repositorio exterior y basa todas sus conclusiones Git en la raíz correcta.

---

## 7. Resultado global

No hay cambios de código, migraciones, configuración ni credenciales introducidos por la intervención. La documentación de implementación está incompleta y existen condiciones preexistentes de exposición de hashes y de literales de contraseña demo que requieren decisión, pero no son regresiones del poblamiento.
