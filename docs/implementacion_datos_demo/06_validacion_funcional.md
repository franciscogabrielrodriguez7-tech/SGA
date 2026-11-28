# 06 — Validación Funcional con el Backend SGA (`sga_db` local)

> **Nota de trazabilidad documental:** documento completado en el cierre documental. Conforme a `docs/auditoria_post_poblamiento/01_resumen_auditoria.md`, las pruebas funcionales y de integración HTTP/ASGI sobre `sga_db` se registran como **resultados declarados por Antigravity (`AG`)**, no reproducidos durante la auditoría de solo lectura de OpenCode.

---

## 1. Suite de pruebas automatizadas del backend (`AG`)

- **Comando ejecutado en `sga_backend_jwt`:** `.\venv\Scripts\python.exe -m pytest -q`
- **Resultado observado (`AG`):** `54 passed, 5 warnings` (código de salida `0`).

---

## 2. Comprobaciones de integración ASGI contra `sga_db` local (`AG`)

Pruebas de lectura, autenticación y control de acceso RBAC ejecutadas por Antigravity contra `app.main.app` conectado a `sga_db` local:

| Endpoint | Rol / Caso | HTTP declarado (`AG`) | Resultado observado (`AG`) |
|---|---|---:|---|
| `POST /api/sga/auth/login` | `admin`, `encargado_facturacion`, `encargado_logistico` | 200 | Inicio de sesión exitoso, emisión de JWT y ausencia del campo `contrasena_usuario` en la respuesta |
| `POST /api/sga/auth/login` | `cliente` (`DEMO-CLI-01`) | 401 | Rechazo esperado (`LOGIN_INVALID`) |
| `GET /api/sga/usuarios` | `admin` / `encargado_logistico` | 200 / 403 | `5` usuarios internos listados para `admin` sin `contrasena_usuario`; `403` para `encargado_logistico` |
| `GET /api/sga/productos` | `encargado_logistico` | 200 | `9` productos activos (`id=10` inactivo excluido por defecto) |
| `GET /api/sga/alquileres` | `encargado_facturacion` | 200 | `8` contratos |
| `GET /api/sga/alquileres/proximos-vencer` | `encargado_logistico` | 200 | `1` contrato (`id=3`) |
| `GET /api/sga/alquileres/pendientes-entrega` | `encargado_logistico` | 200 | `2` contratos (`id=1, 2`) |
| `PATCH /api/sga/alquileres/1/estado` | `encargado_logistico` | 403 | Bloqueo RBAC esperado |
| `GET /api/sga/gastos` | `encargado_logistico` | 200 | `5` registros de tipo `GASTO` |
| `GET /api/sga/gastos/resumen-semanal` | `encargado_logistico` / `encargado_facturacion` | 403 / 200 | `403` para logístico; `200` con `3` semanas agrupadas para facturación |
| `GET /api/sga/alquileres/6/historial` | `encargado_facturacion` | 200 | `2` eventos asociados al contrato `6` |
