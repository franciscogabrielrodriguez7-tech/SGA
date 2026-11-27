# 02 — Respaldo Previo a la Limpieza (`sga_db`)

## 1. Objetivo

Garantizar la reversibilidad total del entorno local `sga_db` antes de truncar los datos existentes y documentar el estado inicial observado previo a la intervención.

---

## 2. Estado previo de `sga_db` antes del respaldo

Verificación ejecutada en solo lectura sobre `localhost:5432` / `sga_db`:

- **Motor:** PostgreSQL `18.4` (`x86_64-windows`).
- **Revisión `alembic_version`:** `d4f74f3d4896` (`1` fila).
- **Inventario estructural:** `8` tablas, `1` vista (`vw_dashboard_operativo`), `5` secuencias, `12` funciones PL/pgSQL, `19` triggers (`34` filas por evento en `information_schema.triggers`), `26` índices, `92` restricciones.
- **Conteo de filas previo:**
  - `usuario`: `21`
  - `producto`: `7`
  - `alquiler`: `3`
  - `detalle_alquiler`: `8`
  - `logistica_alquiler`: `5`
  - `logistica_alquiler_alquiler`: `5`
  - `auditoria_sistema`: `78`
  - `alembic_version`: `1`
- **Anomalías previas confirmadas:**
  - `H-DB-04`: producto `id_producto = 3` con `stock_total = 200`, `stock_alquilado = 6`, pero `calculado_abiertos = 3`.
  - `H-DB-05`: `1` registro en `auditoria_sistema` con `id_usuario_accion` inexistente en `usuario`.
  - `H-DB-06`: `33` registros en `auditoria_sistema` con `id_usuario_accion IS NULL`.
  - `H-DB-08`: `21` registros en `auditoria_sistema` con la clave `"contrasena_usuario"` serializada en `datos_nuevos`.

---

## 3. Ejecución y verificación del respaldo

El respaldo se generó en formato custom de PostgreSQL fuera del repositorio Git utilizando `pg_dump.exe` de PostgreSQL 18 (credenciales inyectadas únicamente en memoria mediante `PGPASSWORD`):

```powershell
C:\Program Files\PostgreSQL\18\bin\pg_dump.exe -Fc --no-owner --no-privileges -h localhost -p 5432 -U <usuario_env_redacted> -d sga_db -f C:\RespaldosSGA\sga_db_previo_20261126_210134.dump
```

| Metadato | Valor verificado |
|---|---|
| Archivo generado | `C:\RespaldosSGA\sga_db_previo_20261126_210134.dump` |
| Fecha y hora | `2026-11-26T21:01:34` |
| Código de salida | `0` |
| Tamaño | `59119` bytes |
| SHA-256 | `90c05df5a9f22000b5b9ac065a755770869cf6ffd811cd6254e7c164226e709c` |
| Verificación de catálogo (`pg_restore -l`) | Exitosa (`101` elementos TOC no comentados) |

---

## 4. Reglas de custodia cumplidas

- El archivo `.dump` permanece únicamente en `C:\RespaldosSGA\`, fuera de `SGA_repo/SGA`.
- No contiene credenciales impresas en logs ni ha sido agregado al control de versiones Git.
