# SGA — Índice de Gestión del Proyecto

> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git`
> **Fuente de verdad:** `SGA_repo/SGA` · rama `dev` · línea base documental de Fase 0: commit `c100a78f53a61828bec1c17aff4c9e2017336c1b`; `HEAD` verificado el 2026-11-11: `32b232eceb814df2a8ea8d047b31057cf245455f` (coincide con `origin/dev` según la referencia de seguimiento local; `deployment` en `3ee0d66`)
> **Estructura creada:** 2026-10-28 · Fase 0.2 (organización documental preparatoria)
> **Estado:** línea base de Fase 0 versionada en `dev` (commit `c100a78`); `MAT-2026-001` y `CHK-2026-001` versionados en `dev` (commit `0f56f5d`) y presentes en `deployment` (merge `3ee0d66`); sin registro formal de aprobación de su contenido por el propietario. Versionado en commit `32b232e` (2026-11-10): cierre formal de `RM-DOC-014`, decisión sobre Alembic y actualización de READMEs. Actualización documental del 2026-11-11 (v0.5): cierre formal de `RM-DOC-008`, actualización de `README.md` (separación local/producción, seed con datos ficticios de prueba, pgAdmin 4 exclusivo para producción sin exposición de datos de despliegue) y sincronización de matriz y checklist, pendiente de commit.

---

## ÍNDICE

1. [Estructura de carpetas](#1-estructura-de-carpetas)
2. [Auditorías (01_auditorias)](#2-auditorías)
3. [Consultas técnicas (02_consultas_tecnicas)](#3-consultas-técnicas)
4. [Decisiones (03_decisiones)](#4-decisiones)
5. [Diagnósticos (04_diagnostico)](#5-diagnósticos)
6. [Roadmap (05_roadmap)](#6-roadmap)
7. [Evidencias (06_evidencias)](#7-evidencias)
8. [Documentos versionados referenciados](#8-documentos-versionados-referenciados)
9. [Convención de identificadores](#9-convención-de-identificadores)
10. [Plantillas documentales](#10-plantillas-documentales)
11. [Estado de la información sensible](#11-estado-de-la-información-sensible)

---

## 1. Estructura de carpetas

```text
docs/gestion_proyecto/
├── 00_indice.md                        ← Este archivo (catálogo maestro)
├── 01_auditorias/                      ← Informes de auditoría (solo lectura histórica)
│   ├── AUD-2026-001_auditoria_inicial_dev_14726ad.md
│   ├── AUD-2026-002_auditoria_dev_remota_12760d4.md
│   ├── AUD-2026-003_consolidacion_comparativa_fase0_paso02.md
│   ├── AUD-2026-004_inventario_original_fase0_paso04.md
│   ├── AUD-2026-005_revision_consistencia_fase0_paso04.md
│   ├── AUD-2026-006_ajuste_final_consistencia_fase0_paso04.md
│   └── AUD-2026-007_hallazgos_tecnicos_auditoria_estatica_opencode.md
├── 02_consultas_tecnicas/              ← Preguntas técnicas y respuestas (vacío por ahora)
│   └── .gitkeep
├── 03_decisiones/                      ← Decisiones aprobadas / ADRs (vacío por ahora)
│   └── .gitkeep
├── 04_diagnostico/                     ← Diagnóstico técnico por área
│   ├── DXC-2026-001_arquitectura.md
│   ├── DXC-2026-002_base_de_datos.md
│   ├── DXC-2026-003_api_contrato.md
│   ├── DXC-2026-004_frontend_componentes.md
│   ├── DXC-2026-005_reglas_negocio_rbac.md
│   └── DXC-2026-006_despliegue_configuracion.md
├── 05_roadmap/                         ← Planeación documental (roadmap RDM- pendiente)
│   ├── .gitkeep
│   ├── MAT-2026-001_matriz_maestra_documental.md
│   └── CHK-2026-001_checklist_tareas_sga.md
└── 06_evidencias/                      ← Verificaciones y comprobaciones
    ├── EVD-2026-001_verificacion_linea_base_fase01.md
    ├── EVD-2026-002_verificacion_clasificacion_evidencias_fase0_paso03.md
    └── EVD-2026-003_inventario_unico_hallazgos_fase0_paso04.md
```

> [!NOTE]
> Las carpetas `02_consultas_tecnicas/` y `03_decisiones/` contienen únicamente
> un archivo `.gitkeep` vacío para preservar la estructura de directorios en Git sin generar documentos
> placeholder ficticios (F-39). Se poblarán con su primer documento real cuando corresponda.
> `05_roadmap/` conserva su `.gitkeep` junto a los documentos de planeación documental (§6).

---

## 2. Auditorías

Documentos de solo lectura histórica. **No se modifica su contenido.**

| ID | Archivo | Commit de referencia | Estado | Vigencia |
|---|---|---|---|---|
| AUD-2026-001 | [AUD-2026-001_auditoria_inicial_dev_14726ad.md](01_auditorias/AUD-2026-001_auditoria_inicial_dev_14726ad.md) | `dev` @ `14726ad` | **Histórico** (contrastado por AUD-2026-002) | 49 hallazgos F-01…F-49; vigente como registro histórico |
| AUD-2026-002 | [AUD-2026-002_auditoria_dev_remota_12760d4.md](01_auditorias/AUD-2026-002_auditoria_dev_remota_12760d4.md) | `origin/dev` @ `12760d4` | **Vigente** (HEAD en la fecha de la auditoría) | 16 hallazgos R-01…R-16; base confirmada Fase 0.1 |
| AUD-2026-003 | [AUD-2026-003_consolidacion_comparativa_fase0_paso02.md](01_auditorias/AUD-2026-003_consolidacion_comparativa_fase0_paso02.md) | `dev` / `origin/dev` @ `12760d4` | **Vigente** (Fase 0, paso 0.2) | Consolidación comparativa F-01…F-49 ↔ R-01…R-16; matriz de correspondencias; clasificación corregida; condiciones del paso 0.2 |
| AUD-2026-004 | [AUD-2026-004_inventario_original_fase0_paso04.md](01_auditorias/AUD-2026-004_inventario_original_fase0_paso04.md) | `dev` @ `12760d4` | **Histórico** (Fase 0, paso 0.4 — revisado por AUD-2026-005 y AUD-2026-006) | Entrega original de OpenCode del inventario único del paso 0.4; conservada íntegra para trazabilidad (versión definitiva consolidada en EVD-2026-003) |
| AUD-2026-005 | [AUD-2026-005_revision_consistencia_fase0_paso04.md](01_auditorias/AUD-2026-005_revision_consistencia_fase0_paso04.md) | `dev` @ `12760d4` | **Histórico** (Fase 0, paso 0.4 — ajustado por AUD-2026-006) | Primera revisión de consistencia del paso 0.4 (INC-1…INC-7: ajuste de 92 a 91 elementos, C-14, prioridades y clasificación P-01…P-26) |
| AUD-2026-006 | [AUD-2026-006_ajuste_final_consistencia_fase0_paso04.md](01_auditorias/AUD-2026-006_ajuste_final_consistencia_fase0_paso04.md) | `dev` @ `12760d4` | **Histórico** (Fase 0, paso 0.4 — aplicado en EVD-2026-003) | Ajuste final de consistencia del paso 0.4 con recuentos definitivos reconstruidos y sustituciones S-1…S-6 aplicadas en EVD-2026-003 |
| AUD-2026-007 | [AUD-2026-007_hallazgos_tecnicos_auditoria_estatica_opencode.md](01_auditorias/AUD-2026-007_hallazgos_tecnicos_auditoria_estatica_opencode.md) | `dev` @ `9a04288` | **Vigente** (Fase 0, ampliación posterior) | Hallazgos técnicos de auditoría estática: DXA-06 (exposición hash contraseña, probable P0), DXA-12b (inicialización BD incompleta en Docker, probable P1), DXA-41 (`stamp` vs `upgrade`, verificado P2) y discrepancias documentales DXA-D1…DXA-D7. Pendiente de revisión del propietario. |

> [!IMPORTANT]
> AUD-2026-002 es la auditoría vigente. AUD-2026-001 se conserva como registro histórico
> contrastado — no actualizar sus conclusiones para que aparenten describir el código actual.

---

## 3. Consultas técnicas

> Carpeta vacía. Se clasificarán aquí las futuras consultas técnicas con formato `CON-AAAA-NNN_slug.md`.

---

## 4. Decisiones

> Carpeta vacía. Las decisiones aprobadas se registrarán aquí con formato `DEC-AAAA-NNN_slug.md`.
> No se convierten recomendaciones de auditoría en decisiones sin aprobación formal.
> Campo `Aprueba:` obligatorio en toda entrada.

---

## 5. Diagnósticos

Diagnósticos técnicos por área obtenidos mediante ingeniería inversa del código fuente.
**Todos corresponden al commit `14726ad`** (anterior al `HEAD` `12760d4` auditado en AUD-2026-002; el `HEAD` actual figura en la cabecera).
Cada uno incluye un **banner de vigencia** al inicio.

| ID | Archivo | Área | Vigencia | Advertencias principales |
|---|---|---|---|---|
| DXC-2026-001 | [DXC-2026-001_arquitectura.md](04_diagnostico/DXC-2026-001_arquitectura.md) | Arquitectura, capas, flujo de datos | ⚠️ Parcialmente obsoleto | Menciona router `inventario` (eliminado, R-07); referencias a Vercel/Render (R-09; destino del frontend actualizado por decisión del propietario, ver `MAT-2026-001` §2.1.c) |
| DXC-2026-002 | [DXC-2026-002_base_de_datos.md](04_diagnostico/DXC-2026-002_base_de_datos.md) | Esquema BD, ORM, migraciones | ⚠️ Obsoleto en migraciones | Cita baseline `d4f74f3d4896` (**eliminado**; reemplazado por `0001_initial_schema`, F-32) |
| DXC-2026-003 | [DXC-2026-003_api_contrato.md](04_diagnostico/DXC-2026-003_api_contrato.md) | Contrato de 45 endpoints REST | ⚠️ Obsoleto (45 → 38 endpoints) | Documenta routers `inventario`/`renovaciones` GET (**eliminados**, R-07) |
| DXC-2026-004 | [DXC-2026-004_frontend_componentes.md](04_diagnostico/DXC-2026-004_frontend_componentes.md) | Componentes React, CSS | ⚠️ Parcialmente obsoleto | No incluye 25 componentes nuevos (commits 2026-09-22 → 2026-10-15) |
| DXC-2026-005 | [DXC-2026-005_reglas_negocio_rbac.md](04_diagnostico/DXC-2026-005_reglas_negocio_rbac.md) | Reglas de negocio, RBAC | ✅ Mayormente vigente | RBAC intacto (S-10); contrastar con AUD-2026-002 |
| DXC-2026-006 | [DXC-2026-006_despliegue_configuracion.md](04_diagnostico/DXC-2026-006_despliegue_configuracion.md) | Despliegue y configuración | ⛔ Obsoleto | Describe Render+Vercel+`vercel.json` (retirado en `f19e845`, R-09); stack real al auditar: Docker Compose. `vercel.json` se reintrodujo en `9a04288`; Vercel es el destino principal del frontend por decisión del propietario, sin despliegue verificado (ver `MAT-2026-001`, §2.1.c y §7.11). **Tabla de credenciales saneada** (R-08) |

> [!WARNING]
> Los diagnósticos describen el estado del código a 2026-10-19 (`14726ad`).
> No son descripciones del estado actual (`12760d4` auditado en AUD-2026-002; `HEAD` verificado el 2026-11-09: `9a04288`). Consultar AUD-2026-002 para el estado vigente.

---

## 6. Roadmap

Documentos de planeación documental de `05_roadmap/`. Son **documentos vivos**: se actualizan mediante cambios versionados en Git.

| ID | Archivo | Naturaleza | Estado |
|---|---|---|---|
| MAT-2026-001 | [MAT-2026-001_matriz_maestra_documental.md](05_roadmap/MAT-2026-001_matriz_maestra_documental.md) | Matriz maestra documental: inventario de documentos, catálogo de documentos oficiales y correspondencia con `RM-DOC-001`…`RM-DOC-018` y `EVD-2026-003` | Versionado en `dev` (`0f56f5d`); contenido en revisión del propietario |
| CHK-2026-001 | [CHK-2026-001_checklist_tareas_sga.md](05_roadmap/CHK-2026-001_checklist_tareas_sga.md) | Checklist de las tareas documentales `RM-DOC-001`…`RM-DOC-018` | Versionado en `dev` (`0f56f5d`); contenido en revisión del propietario |

> El roadmap oficial usará el formato `RDM-AAAA-NNN_slug.md` (ruta prevista: `05_roadmap/RDM-2026-001_roadmap_correccion_sga.md`).
> **No existe todavía** y no se crea hasta que su contenido esté completo y aprobado.
> La checklist cubre únicamente tareas documentales; no sustituye al roadmap de correcciones técnicas.

---

## 7. Evidencias

| ID | Archivo | Commit de referencia | Finalidad | Vigencia |
|---|---|---|---|---|
| EVD-2026-001 | [EVD-2026-001_verificacion_linea_base_fase01.md](06_evidencias/EVD-2026-001_verificacion_linea_base_fase01.md) | `12760d4` (2026-10-28 10:59) | Evidencia de que el remoto no cambió entre sesiones | ✅ Vigente como evidencia histórica. Nota: registra el estado del árbol **previo a la reubicación** de archivos a `SGA_obsoleto/`. |
| EVD-2026-002 | [EVD-2026-002_verificacion_clasificacion_evidencias_fase0_paso03.md](06_evidencias/EVD-2026-002_verificacion_clasificacion_evidencias_fase0_paso03.md) | `dev` @ `12760d4` (2026-10-30) | Clasificación de evidencias de 116 identificadores (F, R, S, H, C, P) y corrección documental puntual de C-14 (Fase 0, paso 0.3) | ✅ Vigente (pendiente de aprobación del paso 0.3 por el usuario). |
| EVD-2026-003 | [EVD-2026-003_inventario_unico_hallazgos_fase0_paso04.md](06_evidencias/EVD-2026-003_inventario_unico_hallazgos_fase0_paso04.md) | `dev` @ `12760d4` (2026-10-30) | Inventario único consolidado de 91 elementos (I-001…I-091), trazabilidad de 130 identificadores y decisiones pendientes (Fase 0, paso 0.4) | ✅ Vigente (pendiente de revisión y aprobación del paso 0.4 por el usuario). |

---

## 8. Documentos versionados referenciados

Estos documentos permanecen en sus ubicaciones originales dentro de `SGA_repo/SGA/`.
**No se mueven** (son cara del proyecto o documentación junto al código).

| Documento | Ubicación | Estado | Nota |
|---|---|---|---|
| `README.md` raíz | [`README.md`](../../README.md) | ✅ Actualizado 2026-11-11. `RM-DOC-008` **cerrada**. Separación de entorno local (datos ficticios de seed para desarrollo) y producción (pgAdmin 4 exclusivo, sin datos sensibles). Credenciales erróneas eliminadas, login por `email_usuario`/`telefono_usuario`, versión PostgreSQL aclarada y gestión de esquema por Alembic. | Cara del proyecto; no mover |
| `AGENTS.md` raíz | [`AGENTS.md`](../../AGENTS.md) | ✅ Vigente (creado en Fase 0) | Instrucciones operativas exclusivas para OpenCode (solo lectura); permanece en la raíz |
| `database/README_base_de_datos.md` | [`database/README_base_de_datos.md`](../../database/README_base_de_datos.md) | ⚠️ Desactualizada + **credencial en texto plano** (R-08) | Saneamiento R-08 pendiente (P0, fuera de este alcance) |
| `database/03_documentacion/INDICE.md` | [`database/03_documentacion/INDICE.md`](../../database/03_documentacion/INDICE.md) | ⚠️ Esquema antiguo + **credencial** (R-08, F-43) | Ídem |
| `sga_backend_jwt/README.md` | [`sga_backend_jwt/README.md`](../../sga_backend_jwt/README.md) | ⚠️ En conflicto con `entrypoint.sh` (R-02) | Documentación junto al código |
| `sga_frontend_jwt/README.md` | [`sga_frontend_jwt/README.md`](../../sga_frontend_jwt/README.md) | ✅ Actualizado 2026-11-09 y versionado en `2f1e14e`. `RM-DOC-014` **cerrada**. Árbol real de `src/`, sección de despliegue Vercel, CORS y comandos `npm` verificados. | Documentación junto al código |
| `docs/` placeholders × 6 | `docs/architecture/`, `docs/requirements/`, `docs/scrum/`, `docs/ui_ux/` | ⛔ Vacíos (0 B, F-39) | Decisión sobre poblar o eliminar: fase posterior |

> [!CAUTION]
> `database/README_base_de_datos.md` y `database/03_documentacion/INDICE.md` contienen
> credenciales en texto plano (hallazgo R-08, P0). Su saneamiento es una tarea independiente
> que requiere autorización propia — **no está incluida en este alcance**.

---

## 9. Convención de identificadores

### Prefijos de documento

| Prefijo | Categoría | Carpeta | Formato |
|---|---|---|---|
| `AUD-` | Auditoría | `01_auditorias/` | `AUD-AAAA-NNN_descripcion_rama_commit.md` |
| `CON-` | Consulta técnica | `02_consultas_tecnicas/` | `CON-AAAA-NNN_slug_corto.md` |
| `DEC-` | Decisión | `03_decisiones/` | `DEC-AAAA-NNN_slug_corto.md` |
| `DXC-` | Diagnóstico | `04_diagnostico/` | `DXC-AAAA-NNN_area.md` |
| `RDM-` | Roadmap | `05_roadmap/` | `RDM-AAAA-NNN_slug.md` |
| `MAT-` | Matriz documental | `05_roadmap/` | `MAT-AAAA-NNN_slug.md` |
| `CHK-` | Checklist de tareas | `05_roadmap/` | `CHK-AAAA-NNN_slug.md` |
| `EVD-` | Evidencia | `06_evidencias/` | `EVD-AAAA-NNN_slug.md` |

Donde `AAAA` = año, `NNN` = correlativo desde `001` dentro del prefijo.

### Identificadores internos en uso

| Prefijo | Uso | Estado |
|---|---|---|
| `F-NN` | Hallazgos auditoría 1 (AUD-2026-001) | **Congelado** — no reutilizar |
| `R-NN` | Hallazgos auditoría 2 (AUD-2026-002) | **En uso** (P0 activos: R-01, R-02, R-04, R-08, R-10, R-15) |
| `S-NN` | Fortalezas / regresión vigilada | En uso |
| `H-NN` | Hipótesis (audit 1) / H-d…H-f (audit 2) | En uso |
| `RN-XXX-NN` | Reglas de negocio (catálogo del código) | Heredado de DXC-2026-005 |

### Reglas de nombre de archivo

1. Minúsculas, sin tildes ni ñ, palabras separadas por `_`.
2. Todo documento lleva **prefijo + año + correlativo**; el slug posterior es descriptivo.
3. Un documento = un identificador.

---

## 10. Plantillas documentales

### 10.1 Auditoría (`AUD-`)

```markdown
# AUD-AAAA-NNN — <Título>

> **Repositorio:** <url>   **Rama:** <rama>   **Commit:** <sha completo>
> **Fecha de auditoría:** AAAA-MM-DD   **Modo:** solo lectura
> **Estado del informe:** vigente | histórico (contrastado por <AUD posterior>)
> **Restricciones aplicadas:** <lista breve>

## 1. Alcance y método
## 2. Resumen ejecutivo (veredicto)
## 3. Hallazgos
### <ID> — <Título>
- **Descripción:**
- **Evidencia:** archivo:línea
- **Estado:** verificado | probable | no comprobado
- **Riesgo/impacto:**
- **Recomendación:**          ← NO es decisión aprobada
- **Prioridad:** P0–P3
## 4. Entregables específicos del encargo
## 5. Ítems no comprobados e hipótesis
## 6. Declaración de operaciones realizadas
```

### 10.2 Consulta técnica (`CON-`)

```markdown
# CON-AAAA-NNN — <Pregunta>

> **Fecha:** AAAA-MM-DD   **Línea base:** rama <rama> @ <sha>
> **Tipo:** git | código | infra | proceso

## Pregunta
## Respuesta (con evidencia archivo:línea o comando+salida)
## Verificado / No comprobado
## Relacionados: <AUD/DEC/Hallazgos citados>
```

### 10.3 Decisión (`DEC-`)

```markdown
# DEC-AAAA-NNN — <Decisión>

> **Fecha de aprobación:** AAAA-MM-DD   **Aprueba:** <rol/usuario>
> **Origen:** <AUD-… / CON-… / RDM-…>   **Estado:** propuesta | aprobada | superseded por DEC-…

## Contexto
## Decisión (texto normativo, una frase)
## Consecuencias (qué queda obligado / qué cambia)
## Alternativas descartadas
```

### 10.4 Hallazgo (bloque reutilizable dentro de AUD/DXC)

```markdown
### <ID> — <Título>
| Campo | Valor |
|---|---|
| Descripción | … |
| Evidencia | `archivo:línea` |
| Estado | verificado / probable / no comprobado |
| Riesgo | … |
| Recomendación | … (propuesta, no aprobada) |
| Prioridad | P0 / P1 / P2 / P3 |
| Estado de cierre | abierto / cerrado por <commit/DEC> |
```

---

## 11. Estado de la información sensible

| Documento | Tipo de dato | Estado en esta copia |
|---|---|---|
| `DXC-2026-006_despliegue_configuracion.md` | Tabla de credenciales de prueba del seed (11 usuarios) | ✅ **Excluida** — sustituida por referencia a `database/README_base_de_datos.md` + R-08 |
| `DXC-2026-001_arquitectura.md` | Mención de contraseñas de seed (H-05) | ✅ **Saneado** — valores reemplazados por `<credencial de prueba — ver R-08>` |
| `DXC-2026-002_base_de_datos.md` | Descripción del seed con credencial (L414 original) | ✅ **Saneado** — valor reemplazado por `<credencial de prueba — ver R-08>` |
| `DXC-2026-005_reglas_negocio_rbac.md` | Mención de política de contraseñas (sin valores reales) | ✅ Sin datos sensibles — no requería saneamiento |
| `AUD-2026-001`, `AUD-2026-002`, `EVD-2026-001` | — | ✅ Verificado: 0 coincidencias de valores sensibles |
| `database/README_base_de_datos.md` | Credencial en texto plano (R-08) | ⚠️ **Pendiente** — saneamiento fuera de este alcance (archivo versionado, P0) |
| `database/03_documentacion/INDICE.md` | Credencial (R-08, F-43) | ⚠️ **Pendiente** — ídem |

> [!CAUTION]
> Ningún documento de `docs/gestion_proyecto/` debe contener contraseñas, hashes, tokens
> ni secretos reales. Las credenciales se citan únicamente como **ruta de archivo + ID de hallazgo**.

---

*Fin del índice — Fase 0.2 organización documental. Paso 0.2 no se considera completado
automáticamente: queda pendiente la consolidación de auditorías prevista en la checklist oficial.*
