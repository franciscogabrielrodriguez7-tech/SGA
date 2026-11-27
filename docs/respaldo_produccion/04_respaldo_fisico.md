# 04 — Respaldo Físico Completo de Producción (`sga_db_mydd`)

**Estado de la actividad:** **Ejecutada** (respaldo externo generado y verificado sin modificar producción ni el repositorio Git).  
**Fecha:** 2026-11-27

---

## 1. Ejecución de `pg_dump`

Se ejecutó `C:\Program Files\PostgreSQL\18\bin\pg_dump.exe` con formato custom (`-Fc`), opciones `--no-owner --no-privileges`, `PGSSLMODE=require` y credenciales en memoria (sin imprimir URL, usuario ni contraseña en archivos ni logs):

```powershell
pg_dump.exe -Fc --no-owner --no-privileges -h dpg-dbnu9q5g1s2s73dn3kh0-a.oregon-postgres.render.com -p 5432 -U <redacted> -d sga_db_mydd -f C:\RespaldosSGA\sga_db_mydd_previo_carga_20261127_091347.dump
```

---

## 2. Verificación del archivo generado

| Verificación | Resultado observado | Estado |
|---|---|---|
| Existencia del archivo | `C:\RespaldosSGA\sga_db_mydd_previo_carga_20261127_091347.dump` (fuera del repo Git) | Cumplida |
| Código de salida (`pg_dump.exe`) | `0` | Cumplida |
| Tamaño del archivo | `58726` bytes (`> 0`) | Cumplida |
| Hash SHA-256 | `0d5b35e6e5a5d40e8811323cfb73f287ccbc3d9540b0bbc4aa8af571c1d4f3c2` | Cumplida |
| Verificación de catálogo (`pg_restore -l`) | Exitosa (`102` elementos TOC activos) | Cumplida |
| Ausencia de `.dump` en repositorio Git | `BAD_TRACKED = 0`, `WORKTREE_DUMPS = 0` | Cumplida |
