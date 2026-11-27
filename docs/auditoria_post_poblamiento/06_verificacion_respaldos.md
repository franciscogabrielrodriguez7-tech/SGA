# 06 — Verificación de respaldos

> **Fecha:** 2026-11-26  
> **Origen:** `OP` = verificado personalmente por OpenCode · `AG` = declarado por Antigravity  
> **Restricción:** no se restauró ningún respaldo ni se modificó base de datos alguna.

---

## 1. Archivos declarados

| Respaldo | Ruta |
|---|---|
| Previo a la intervención | `C:\RespaldosSGA\sga_db_previo_20261126_210134.dump` |
| Final tras validación | `C:\RespaldosSGA\sga_db_final_demo_20261126_210652.dump` |

Procedimiento (`OP`): `Test-Path`, `Get-Item`, `Get-FileHash -Algorithm SHA256` y `pg_restore.exe -l <archivo>`; se contaron las líneas de la tabla de contenidos que no son comentarios.

---

## 2. Resultados

| Verificado | Respaldo previo | Respaldo final | Esperado (`AG`) | Estado |
|---|---|---|---|---|
| Existencia | Sí | Sí | Sí | **aprobado** |
| Tamaño (bytes) | 59119 | 60161 | 59119 / 60161 | **aprobado** |
| SHA-256 | `90c05df5a9f22000b5b9ac065a755770869cf6ffd811cd6254e7c164226e709c` | `679913dbc14f55d05091874466159ba280507abe691c96cd475b69ce42270b60` | Iguales a los declarados | **aprobado** |
| Coincidencia de hash | Sí | Sí | Sí | **aprobado** |
| `pg_restore -l` | Código de salida `0` | Código de salida `0` | Salida correcta | **aprobado** |
| Entradas TOC no comentadas | 101 | 101 | 101 (`AG`) | **aprobado** |

---

## 3. Alcance de la verificación

`pg_restore -l` solo lee la tabla de contenidos del archivo; **no restaura datos**. Por tanto, esta auditoría confirma existencia, integridad criptográfica y legibilidad estructural de ambos respaldos, pero **no confirma** que una restauración completa haya sido ejecutada por esta auditoría.

La restauración de prueba en `sga_verify_tmp` y su posterior eliminación, declaradas por Antigravity, se registran como **no verificable** personalmente. No se ejecutó ninguna restauración durante esta auditoría.

---

## 4. Resultado global

Los respaldos están presentes fuera del repositorio, sus hashes y tamaños coinciden exactamente con la declaración y ambos catálogos son legibles. No hay `fallido` ni `no verificable` en los controles ejecutados personalmente.
