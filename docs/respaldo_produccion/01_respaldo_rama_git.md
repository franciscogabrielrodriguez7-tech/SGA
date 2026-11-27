# 01 — Respaldo de Rama Git Antes de Carga en Producción

**Estado de la actividad:** **Ejecutada** (Fase 1 completada; sin modificaciones a `dev` ni a ramas previas; sin `push` remoto).  
**Fecha:** 2026-11-27  
**Repositorio:** `C:\Users\Acer\Documents\Default Project\SGA_repo\SGA`

---

## 1. Inspección inicial previa (Fase 1.1)

| Elemento | Resultado observado |
|---|---|
| Raíz del repositorio (`git rev-parse --show-toplevel`) | `C:/Users/Acer/Documents/Default Project/SGA_repo/SGA` |
| Rama activa al iniciar | `backup/sga-antes-estabilizacion-2026-11-27` |
| `HEAD` al iniciar | `d5496b1091df4ea039324d7ed7f2c1abeb026a61` |
| Existencia de `backup/sga-antes-estabilizacion-2026-11-27` | Sí (`refs/heads/backup/sga-antes-estabilizacion-2026-11-27` -> `d5496b1091df4ea039324d7ed7f2c1abeb026a61`) |
| Cambios rastreados modificados/eliminados | Ninguno |
| Archivos pendientes no versionados (`git status --short`) | `?? docs/respaldo_rama/` (`docs/respaldo_rama/01_informe_respaldo_rama.md` continúa sin incorporarse) |

---

## 2. Creación de la rama de respaldo (Fase 1.2)

- **Nueva rama creada:** `backup/sga-antes-carga-produccion-2026-11-27`
- **Commit de origen:** `d5496b1091df4ea039324d7ed7f2c1abeb026a61`
- **Commit respaldado en la nueva rama:** `d5496b1091df4ea039324d7ed7f2c1abeb026a61`
- **Decisión sobre cambios pendientes:** no se descartó ni se incorporó automáticamente `docs/respaldo_rama/01_informe_respaldo_rama.md`; queda identificado y presentado para decisión del usuario antes de cualquier commit adicional.

---

## 3. Verificaciones ejecutadas (Fase 1.3)

| Verificación | Resultado observado | Estado |
|---|---|---|
| Existencia local de `backup/sga-antes-carga-produccion-2026-11-27` | Presente y activa en `d5496b1091df4ea039324d7ed7f2c1abeb026a61` | Cumplida |
| Ancestría del commit de origen (`git merge-base --is-ancestor`) | `True` (`d5496b1091df4ea039324d7ed7f2c1abeb026a61`) | Cumplida |
| Estado de `dev` | Intacta en `599f96fd28e282725e6a325604e8ddaa0b8850b5` | Cumplida |
| Estado de `feat/taller-6-calidad-sqa` | Intacta en `cd4a48590334675569409f197f446679065974ab` | Cumplida |
| Estado de `backup/sga-antes-estabilizacion-2026-11-27` | Intacta en `d5496b1091df4ea039324d7ed7f2c1abeb026a61` | Cumplida |
| Ausencia de `.env`, `.dump`, `node_modules/`, `venv/` rastreados | `BAD_TRACKED = 0` | Cumplida |
| Ausencia de `.dump` en árbol de trabajo | `WORKTREE_DUMPS = 0` | Cumplida |
| Integridad de archivos clave (`AGENTS.md`, `README.md`, `docker-compose.yml`, `main.py`, `alembic.ini`, `package.json`, `01_tablas.sql`, `api_reference.md`) | Todos verificados en `True` | Cumplida |
| Operaciones remotas (`push`/`fetch`/`merge`) | Ninguna ejecutada | Cumplida |
