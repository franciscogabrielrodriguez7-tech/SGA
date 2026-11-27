# 04 — Respaldo Físico Completo de Producción (`sga_db_mydd`)

**Estado de la actividad:** **Ejecutada** (ambos respaldos externos generados y verificados fuera del repositorio Git).  
**Fecha:** 2026-11-27

---

## 1. Respaldos físicos generados en `C:\RespaldosSGA\`

Sin sobrescribir el respaldo de la fase de inspección previa (`sga_db_mydd_previo_carga_20261127_091347.dump`), se generó un **nuevo respaldo físico completo** inmediatamente antes de la ejecución autorizada:

| Respaldo | Archivo | Tamaño (bytes) | Código salida `pg_dump` | Entradas TOC (`pg_restore -l`) | SHA-256 |
|---|---|---:|---:|---:|---|
| Respaldo 1 (inspección previa) | `C:\RespaldosSGA\sga_db_mydd_previo_carga_20261127_091347.dump` | 58726 | 0 | 102 | `0d5b35e6e5a5d40e8811323cfb73f287ccbc3d9540b0bbc4aa8af571c1d4f3c2` |
| **Respaldo 2 (ejecución autorizada)** | `C:\RespaldosSGA\sga_db_mydd_previo_carga_20261127_094023.dump` | 58726 | 0 | 102 | `c6bd1db2b8656bad26a44ca8282560e22995bd9ab9db9249b3ccd1fb4157c242` |

*(Durante el primer intento de `pg_dump` de la segunda ejecución se registró un corte transitorio de conexión/decodificación CP1252 `sga_db_mydd_previo_carga_20261127_093609.dump` sin tocar la base; el archivo vacío fue descartado y el reintento con `PGCONNECT_TIMEOUT=30` y codificación CP1252 generó `sga_db_mydd_previo_carga_20261127_094023.dump` con salida `0`.)*

---

## 2. Custodia y seguridad

- Ambos archivos `.dump` se encuentran exclusivamente en `C:\RespaldosSGA\`, fuera del árbol del repositorio Git (`WORKTREE_DUMPS = 0`).
- Ninguna URL ni credencial fue almacenada en archivos ni logs.
