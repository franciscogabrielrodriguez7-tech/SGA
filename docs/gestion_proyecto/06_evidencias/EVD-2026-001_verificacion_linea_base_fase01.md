# SGA — Verificación de línea base (Fase 0.1)

> **Repositorio:** `https://github.com/franciscogabrielrodriguez7-tech/SGA.git`
> **Modo:** auditoría de Git exclusivamente en lectura
> **Objetivo:** determinar si `origin/dev` conserva el mismo commit utilizado en la auditoría del 28 de octubre de 2026
> **Commit de referencia:** `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c`
> **Complementa a:** `AUDITORIA_RAMA_REMOTA_DEV.md`

---

## Restricciones aplicadas

| Restricción | Cumplimiento |
|---|---|
| No modificar archivos | ✅ Ninguna escritura sobre archivos del repositorio |
| No checkout / merge / reset / pull / commit / push | ✅ Ninguno |
| No instalar dependencias ni ejecutar el proyecto | ✅ |
| No ejecutar migraciones | ✅ |
| No actualizar referencias remotas (`fetch` sin autorización) | ✅ Solo `git ls-remote` (consulta sin actualización de refs) |
| No mostrar valores de secretos | ✅ |

---

## Informe de comprobación

| Campo | Valor |
|---|---|
| **Fecha de comprobación** | 2026-10-28 10:59:28 (-05:00) · `git version 2.53.0.windows.2` |
| **1. Rama actual** | `dev` |
| **1. HEAD local** | `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` |
| **2. `origin/dev` local** | `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` |
| **3. `origin/dev` publicado** (GitHub, vía `git ls-remote origin refs/heads/dev`) | `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` |
| **4. Estado del árbol de trabajo** (`git status --short`) | Sin cambios en archivos **trackeados**. 8 archivos **sin trackear** (ver §5) |
| **Commit de referencia de la auditoría** | `12760d4b86d40e0eefa7ef8cc4a9bb68292b476c` |
| **Coincidencia con el commit auditado** | ✅ **SÍ** (3/3 identificadores idénticos) |

---

## 1. Rama actual y SHA de HEAD

```text
$ git branch --show-current
dev

$ git rev-parse HEAD
12760d4b86d40e0eefa7ef8cc4a9bb68292b476c
```

## 2. SHA registrado localmente para `origin/dev`

```text
$ git rev-parse origin/dev
12760d4b86d40e0eefa7ef8cc4a9bb68292b476c
```

## 3. SHA publicado en GitHub (solo lectura)

```text
$ git ls-remote origin refs/heads/dev
12760d4b86d40e0eefa7ef8cc4a9bb68292b476c	refs/heads/dev
```

> `git ls-remote` consulta el remoto **sin actualizar** ninguna referencia local (no equivale a `fetch`).

## 4. Estado del árbol de trabajo

```text
$ git status --short
?? AUDITORIA_INICIAL_SGA.md
?? AUDITORIA_RAMA_REMOTA_DEV.md
?? docs/01_arquitectura.md
?? docs/02_base_de_datos.md
?? docs/03_api_contrato.md
?? docs/04_frontend_componentes.md
?? docs/05_reglas_negocio_rbac.md
?? docs/06_despliegue_configuracion.md
```

**0** archivos trackeados modificados · **0** eliminados · **8** sin trackear (todos de creación propia de la auditoría; ninguno proviene del remoto).

## 5. Comparación de identificadores

```text
HEAD local           12760d4b86d40e0eefa7ef8cc4a9bb68292b476c   ← coincide
origin/dev local     12760d4b86d40e0eefa7ef8cc4a9bb68292b476c   ← coincide
origin/dev (GitHub)  12760d4b86d40e0eefa7ef8cc4a9bb68292b476c   ← coincide
Referencia auditoría 12760d4b86d40e0eefa7ef8cc4a9bb68292b476c

Diferencia: 0 commits · 0 archivos
```

### Verificaciones auxiliares (solo lectura)

| Verificación | Resultado |
|---|---|
| `git fsck --no-dangling` | ✅ Sin errores de integridad de objetos |
| Ahead/behind HEAD ↔ `origin/dev` | 0 / 0 (sin desfase) |
| `origin/main` (sin movimiento) | `e4d44117522b79b1c6c68bf5040aaa46a517773f` |
| `origin/deployment` (sin movimiento) | `0bc33acba885f22362b693c890152dfeb7f4688c` |
| Commit identificado | `feat(docker): dockerizar stack completo — postgres, backend FastAPI y frontend Nginx multi-stage` (2026-10-20 20:37:19 -0500, `gabielrodriguez`) |

---

## 6. Nota sobre el árbol de trabajo

Los 8 archivos marcados `??` son **no trackeados** (los 2 informes de auditoría y los 6 documentos `docs/0X_*.md`), por lo tanto:

- **No afectan la línea base**: no alteran ningún contenido versionado ni el SHA del commit.
- Su existencia coincide con lo reportado en las auditorías (**F-08 / F-40 / R-15**: documentación técnica sin versionar y ausente del remoto).

---

## Conclusión

### ✅ LÍNEA BASE CONFIRMADA

La rama `origin/dev` **conserva exactamente el mismo commit** utilizado en la auditoría del 28 de octubre de 2026 (`12760d4…`).

- **No hay commits nuevos** publicados desde la auditoría.
- **No hay reescritura de historia**.
- El árbol de trabajo está **limpio respecto a los archivos versionados**.
- **No se requiere re-auditoría**: los hallazgos de `AUDITORIA_RAMA_REMOTA_DEV.md` (R-01…R-16) siguen siendo **válidos y vigentes**.

---

## Declaración final

- **Operaciones realizadas:** exclusivamente de lectura (`git branch`, `git rev-parse`, `git ls-remote`, `git status`, `git fsck`, `git for-each-ref`).
- **No** se realizó `checkout`, `merge`, `reset`, `pull`, `commit`, `push` ni `fetch`.
- **No** se modificó, creó ni eliminó ningún archivo del repositorio por esta comprobación (este informe es un archivo nuevo no trackeado).
- **No** se instalaron dependencias, **no** se ejecutaron migraciones ni operaciones sobre datos.
- **No** se mostraron valores de secretos.

*Fin del informe — Fase 0.1. Quedo a la espera de instrucciones.*
