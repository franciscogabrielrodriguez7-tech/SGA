# Informe de Rama Git de Respaldo — SGA

## 1. Fecha y hora de creación

- **Fecha y hora del commit de respaldo:** `2026-11-27T08:28:32-05:00` (hora local).

---

## 2. Ruta del repositorio

- **Raíz del repositorio SGA:** `<RAIZ_REPOSITORIO>\SGA_repo\SGA`

---

## 3. Rama de origen

- **Rama activa de origen:** `feat/taller-6-calidad-sqa` (permanece intacta en `cd4a48590334675569409f197f446679065974ab`).

---

## 4. Rama de respaldo creada

- **Nombre de la rama:** `backup/sga-antes-estabilizacion-2026-11-27` (rama local independiente).

---

## 5. Hash del commit original

- **`HEAD` de origen (`feat/taller-6-calidad-sqa`):** `cd4a48590334675569409f197f446679065974ab` (`test(sqa): implementar auditoría de calidad y dossier Taller 6`).

---

## 6. Hash del commit final de respaldo

- **`HEAD` de respaldo (`backup/sga-antes-estabilizacion-2026-11-27`):** `d5496b1091df4ea039324d7ed7f2c1abeb026a61` (`backup: preservar estado SGA antes de estabilización técnica`).

---

## 7. Cambios pendientes incorporados (`26` archivos nuevos)

No existían archivos rastreados modificados ni eliminados (`git diff` vacío). Se incorporaron en el commit `d5496b1091df4ea039324d7ed7f2c1abeb026a61` los `26` archivos de documentación y scripts SQL de auditoría/validación encontrados en el árbol de trabajo (`2837` líneas insertadas):

### `docs/auditoria_base_datos_produccion/` (`11` archivos)
- `01_resumen_general.md`
- `02_inventario_tablas_y_columnas.md`
- `03_relaciones_y_restricciones.md`
- `04_funciones_triggers_y_vistas.md`
- `05_auditoria_alembic.md`
- `06_estado_actual_de_datos.md`
- `07_diseno_datos_demo.md`
- `08_plan_sql_poblamiento.md`
- `09_plan_backup_y_restauracion.md`
- `10_hallazgos_y_riesgos.md`
- `consultas_auditoria.sql`

### `docs/auditoria_post_poblamiento/` (`9` archivos)
- `01_resumen_auditoria.md`
- `02_verificacion_estructura.md`
- `03_verificacion_datos.md`
- `04_integridad_y_consistencia.md`
- `05_auditoria_sistema.md`
- `06_verificacion_respaldos.md`
- `07_verificacion_repositorio.md`
- `08_hallazgos_y_recomendaciones.md`
- `09_dictamen_final.md`

### `docs/implementacion_datos_demo/` (`6` archivos)
- `01_resumen_implementacion.md`
- `02_respaldo_previo.md`
- `04_datos_demo_insertados.md`
- `scripts/01_limpieza_sga_db.sql`
- `scripts/02_poblamiento_demo_sga_db.sql`
- `scripts/03_validacion_sga_db.sql`

*(Observación fiel del estado encontrado: al iniciar la inspección, en `docs/implementacion_datos_demo/` únicamente existían los informes `01`, `02`, `04` y los `3` scripts SQL.)*

---

## 8. Archivos excluidos y motivo

Permanecieron excluidos mediante `.gitignore` (sin agregarse al índice ni al commit):

- **Secretos y configuración local:** `sga_backend_jwt/.env`, `sga_frontend_jwt/.env`.
- **Dependencias instaladas y compilados:** `sga_backend_jwt/venv/`, `sga_frontend_jwt/node_modules/`, `sga_frontend_jwt/dist/`.
- **Temporales y reportes regenerables:** `docs/quality/taller_6/reportes/coverage.xml`, `docs/quality/taller_6/reportes/htmlcov/`, `sga_backend_jwt/.coverage`, `sga_backend_jwt/.pytest_cache/`, directorios `__pycache__/`.
- **Respaldos de base de datos (`.dump`):** ningún archivo `.dump` existe dentro del repositorio (permanecen fuera del repo en `C:\RespaldosSGA\`).

---

## 9. Resultado de las verificaciones

| Verificación | Resultado obtenido | Estado |
|---|---|---|
| Existencia de la rama local `backup/sga-antes-estabilizacion-2026-11-27` | Presente en `git branch -a`, apuntando a `d5496b1091df4ea039324d7ed7f2c1abeb026a61` | Cumplida |
| Ancestría del commit de origen | `git merge-base --is-ancestor cd4a48590334675569409f197f446679065974ab HEAD` retornó `0` (`HEAD^ = cd4a48590334675569409f197f446679065974ab`) | Cumplida |
| Ausencia de secretos / `.env` / `.dump` en el árbol `HEAD` | Escaneo sobre `git ls-tree -r --name-only HEAD` devolvió `0` coincidencias; escaneo previo en los 26 archivos devolvió `0` hashes bcrypt, DSNs o variables de credenciales | Cumplida |
| Presencia de archivos clave del proyecto | `AGENTS.md`, `README.md`, `docker-compose.yml`, `sga_backend_jwt/app/main.py`, `sga_backend_jwt/alembic.ini`, `sga_frontend_jwt/package.json`, `database/01_esquema/01_tablas.sql` y `docs/architecture/api_reference.md` verificados en `True` | Cumplida |
| Aislamiento remoto | No se ejecutó `push`, `fetch`, `merge` ni modificación de ramas remotas | Cumplida |

---

## 10. Confirmación de que `dev` no fue modificada

- `git rev-parse dev` confirmó antes y después de la operación el mismo hash: `599f96fd28e282725e6a325604e8ddaa0b8850b5`.
- Asimismo, `feat/taller-6-calidad-sqa` conserva intacto el commit `cd4a48590334675569409f197f446679065974ab`.

---

## 11. Confirmación de que no se modificó ninguna base de datos

- No se realizó ninguna conexión, consulta ni operación sobre **`sga_db_mydd`** (producción) ni sobre **`sga_db`** (local).

---

## 12. Limitaciones del respaldo

1. **Alcance exclusivamente local:** la rama `backup/sga-antes-estabilizacion-2026-11-27` existe solo en el repositorio local hasta que se autorice su publicación remota (`push`).
2. **Exclusión intencional de artefactos ignorados:** archivos `.env`, `venv/`, `node_modules/`, `dist/`, cachés, reportes de cobertura y archivos `.dump` de PostgreSQL no forman parte de la rama Git y dependen de su custodia fuera de Git.
3. **Estado preexistente documentado:** como también registró `docs/auditoria_post_poblamiento/07_verificacion_repositorio.md`, en `docs/implementacion_datos_demo/` solo estaban presentes los archivos `01`, `02`, `04` y `scripts/01..03` al momento de crear este respaldo; la rama conserva fielmente ese estado exacto sin alterarlo.
4. **Informe posterior al commit:** este archivo ([01_informe_respaldo_rama.md](./01_informe_respaldo_rama.md)) se generó después de registrar `d5496b1091df4ea039324d7ed7f2c1abeb026a61` para documentar su hash final sin modificar el commit de respaldo ni `dev`.
