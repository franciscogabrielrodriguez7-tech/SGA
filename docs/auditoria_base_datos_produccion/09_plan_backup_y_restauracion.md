# 09 — Estrategia de respaldo y restauración

**Estado:** procedimiento recomendado. No se ejecutó ningún `pg_dump`, `pg_restore` ni `createdb`.

## 1. Principios

- Se genera un respaldo de `sga_db` antes de cualquier intervención, aunque la fase actual sea solo de lectura.
- Se genera un segundo respaldo de `sga_demo` al finalizar el poblamiento.
- Los archivos se guardan **fuera del repositorio**, en una ruta con control de acceso, por ejemplo `C:\RespaldosSGA\`.
- Las credenciales se inyectan desde el entorno del operador o desde `.pgpass`; **no** se escriben en comandos, scripts versionados ni informes.

## 2. Respaldo de producción

Formato elegido: `custom` comprimido de `pg_dump` (`-Fc`), que permite restauración selectiva y es portable entre versiones de PostgreSQL.

```powershell
# <host> y <usuario> son marcadores: los sustituye el operador sin exponer secretos.
pg_dump -Fc --no-owner --no-privileges `
  -h <host> -p 5432 -U <usuario> -d sga_db `
  -f "C:\RespaldosSGA\sga_db_20261126_HHMMSS.dump"
```

## 3. Verificación del respaldo

```powershell
# (a) Listado de contenido: confirma que el archivo es legible e incluye los objetos esperados.
pg_restore -l "C:\RespaldosSGA\sga_db_20261126_HHMMSS.dump" | Select-Object -First 40

# (b) Hash para detectar cambios o corrupción del archivo.
Get-FileHash -Algorithm SHA256 "C:\RespaldosSGA\sga_db_20261126_HHMMSS.dump"

# (c) Restauración de prueba en una base temporal aislada (no en producción).
createdb -h <host> -p 5432 -U <usuario> sga_verify_tmp
pg_restore -Fc --no-owner --no-privileges `
  -h <host> -p 5432 -U <usuario> `
  -d sga_verify_tmp "C:\RespaldosSGA\sga_db_20261126_HHMMSS.dump"
```

Comprobaciones mínimas sobre `sga_verify_tmp`: mismos conteos por tabla que los registrados en `06_estado_actual_de_datos.md`, mismas 12 funciones, 19 triggers y 1 vista, y revisión `d4f74f3d4896` en `alembic_version`.

## 4. Restauración sobre la base de demostración

```powershell
createdb -h <host> -p 5432 -U <usuario> sga_demo
pg_restore -Fc --no-owner --no-privileges `
  -h <host> -p 5432 -U <usuario> `
  -d sga_demo "C:\RespaldosSGA\sga_db_20261126_HHMMSS.dump"
```

Tras la restauración se ejecuta el plan de `08_plan_sql_poblamiento.md`. Al terminar se genera el segundo respaldo:

```powershell
pg_dump -Fc --no-owner --no-privileges `
  -h <host> -p 5432 -U <usuario> -d sga_demo `
  -f "C:\RespaldosSGA\sga_demo_poblada_20261126_HHMMSS.dump"
```

## 5. Comprobación de integridad del respaldo

| Mecanismo | Qué verifica |
|---|---|
| `pg_restore -l` | El archivo es un dump válido y enumera tablas, funciones, triggers y vistas |
| `Get-FileHash -Algorithm SHA256` | Integridad byte a byte frente a copias o transferencias |
| Restauración en `sga_verify_tmp` | Que el dump restore completo sin errores |
| Conteos por tabla | Que no se perdió información entre el origen y la copia |
| Conteo de objetos programables | Que funciones/triggers/vistas sobrevivieron al dump |
| Revisión de `alembic_version` | Que se conserva el estado de migración observado |

## 6. Retención y precauciones

- Conservar al menos el respaldo previo a la intervención y el respaldo de la demo poblada durante todo el ciclo de pruebas.
- No sobrescribir respaldos anteriores sin verificar el nuevo con SHA256.
- No almacenar respaldos dentro de `docs/`, `sga_backend_jwt/` ni en ninguna ruta versionada.
- `pg_dump` no modifica la base de origen, pero requiere permisos de lectura; se ejecuta fuera de esta fase de auditoría y solo con autorización.
- No se debe usar `pg_restore` directamente sobre `sga_db`; la restauración siempre apunta a una base aislada.
