# 02 — Medición de Mantenibilidad y Complejidad con Radon

- **Herramienta:** `radon 6.0.1` (`mando: 0.7.1`)
- **Intérprete:** Python `3.12.10` (`sga_backend_jwt/venv`)
- **Alcance:** `sga_backend_jwt/app/` (**47 archivos**, **148 bloques** analizados entre clases, métodos y funciones)
- **RNF relacionado:** `RNF18` / `CP-RNF-18` (Mantenibilidad — Modularidad y Analizabilidad)

---

## 1. Resumen Ejecutivo

### 1.1 Índice de Mantenibilidad (`radon mi app/ -s`)
- **Línea base:** `47` archivos calificación **A**, `0` **B**, `0` **C**, `0` **D**, `0` **F**.
- **Estado final (tras ajustes seguros de Flake8):** **`47` archivos calificación A** (`44.92` a `100.00`), **`0` B**, **`0` C**, **`0` D**, **`0` F** — cumple al 100% la exigencia del taller (notas A o B para todos los archivos).
- Evidencia textual completa: [`reportes/radon_mi.txt`](reportes/radon_mi.txt) (y línea base en [`reportes/baseline_radon_mi.txt`](reportes/baseline_radon_mi.txt)).

### 1.2 Complejidad Ciclomática (`radon cc app/ -s -a -o SCORE`)
- **Bloques analizados:** `148`
- **Complejidad promedio global:** **A (`2.8783783783783785`)**
- **Distribución por rango:**
  - **Rango A (1–5):** `138` bloques (`93.2%`)
  - **Rango B (6–10):** `7` bloques (`4.7%`)
  - **Rango C (11–20):** `3` bloques (`2.0%`)
  - **Rangos D / E / F (> 20):** `0` bloques (`0.0%`)
- Evidencia textual completa: [`reportes/radon_cc.txt`](reportes/radon_cc.txt).

---

## 2. Tabla Completa de Resultados por Archivo (`app/`)

| Archivo | MI y Letra | Bloque/Función con CC más alta | Nivel de riesgo | Acción recomendada | Estado final |
|---|---|---|---|---|---|
| `app/__init__.py` | `100.00` (**A**) | *(sin bloques)* | Bajo | Ninguna | **Cumplido (A)** |
| `app/main.py` | `81.61` (**A**) | `manejar_http_exception` — **A (4)** | Bajo | Ninguna (migrar `on_event` a `lifespan` a futuro) | **Cumplido (A)** |
| `app/config/__init__.py` | `100.00` (**A**) | *(sin bloques)* | Bajo | Ninguna | **Cumplido (A)** |
| `app/config/database.py` | `100.00` (**A**) | `get_db` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/config/settings.py` | `97.43` (**A**) | *(sin bloques)* | Bajo | Ninguna | **Cumplido (A)** |
| `app/controllers/__init__.py` | `100.00` (**A**) | *(sin bloques)* | Bajo | Ninguna | **Cumplido (A)** |
| `app/controllers/alquiler_controller.py` | `44.92` (**A**) | `actualizar_alquiler` — **C (14)**; `crear_alquiler` — **B (6)** | **Medio** | Extraer helpers privados para validación de fechas y cambio de duración (requiere autorización) | **Cumplido MI (A) / Refactor CC C propuesto** |
| `app/controllers/auditoria_controller.py` | `100.00` (**A**) | `historial_alquiler` — **A (3)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/controllers/cliente_controller.py` | `66.06` (**A**) | `actualizar_cliente` — **B (7)**; `crear_cliente` — **B (6)** | Bajo-Moderado | Monitorear; opcional extraer validación de unicidad | **Cumplido (A)** |
| `app/controllers/detalle_alquiler_controller.py` | `75.32` (**A**) | `actualizar_detalle_alquiler` — **A (4)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/controllers/logistica_alquiler_controller.py` | `82.71` (**A**) | `crear_gasto` — **A (4)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/controllers/producto_controller.py` | `70.70` (**A**) | `actualizar_producto` — **A (5)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/controllers/usuario_controller.py` | `59.99` (**A**) | `actualizar_usuario` — **C (11)**; `login_usuario` — **B (8)**; `crear_usuario` — **B (6)** | **Medio** | Extraer helper de verificación de duplicados email/teléfono (requiere autorización) | **Cumplido MI (A) / Refactor CC C propuesto** |
| `app/models/__init__.py` | `100.00` (**A**) | *(sin bloques)* | Bajo | Ninguna | **Cumplido (A)** |
| `app/models/alquiler.py` | `100.00` (**A**) | `Alquiler` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/models/auditoria_sistema.py` | `100.00` (**A**) | `AuditoriaSistema` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/models/detalle_alquiler.py` | `100.00` (**A**) | `DetalleAlquiler` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/models/logistica_alquiler.py` | `100.00` (**A**) | `LogisticaAlquiler` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/models/logistica_alquiler_alquiler.py` | `100.00` (**A**) | `LogisticaAlquilerAlquiler` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/models/producto.py` | `86.77` (**A**) | `Producto` — **A (4)** (`stock_disponible` A 3) | Bajo | Ninguna | **Cumplido (A)** |
| `app/models/usuario.py` | `100.00` (**A**) | `Usuario` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/routes/__init__.py` | `100.00` (**A**) | *(sin bloques)* | Bajo | Ninguna | **Cumplido (A)** |
| `app/routes/alquiler_routes.py` | `48.53` (**A**) | `modificar_alquiler`, `cambiar_estado`, `cancelar`, `renovar`, `crear_entrega`, `crear_recogida` — **A (4)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/routes/auth_routes.py` | `69.46` (**A**) | `login` — **A (4)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/routes/cliente_routes.py` | `51.14` (**A**) | `modificar_cliente`, `cambiar_estado` — **A (4)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/routes/detalle_alquiler_routes.py` | `70.77` (**A**) | `modificar_detalle` — **A (4)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/routes/gastos_routes.py` | `100.00` (**A**) | `registrar_gasto` — **A (3)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/routes/producto_routes.py` | `63.32` (**A**) | `modificar_producto`, `cambiar_estado` — **A (4)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/routes/usuario_routes.py` | `69.25` (**A**) | `listar_usuarios`, `modificar_usuario`, `cambiar_estado` — **A (4)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/schemas/__init__.py` | `100.00` (**A**) | *(sin bloques)* | Bajo | Ninguna | **Cumplido (A)** |
| `app/schemas/alquiler_schema.py` | `79.93` (**A**) | `AlquilerEstadoUpdate` — **A (3)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/schemas/cliente_schema.py` | `88.12` (**A**) | `ClienteCreate` — **A (3)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/schemas/detalle_alquiler_schema.py` | `100.00` (**A**) | `DetalleAlquilerCreate` / `Update` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/schemas/logistica_alquiler_schema.py` | `100.00` (**A**) | `EntregaCreate` / `RecogidaCreate` / `GastoCreate` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/schemas/producto_schema.py` | `100.00` (**A**) | `ProductoCreate` / `Update` / `EstadoUpdate` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/schemas/usuario_schema.py` | `68.75` (**A**) | `UsuarioUpdate` — **A (4)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/utils/__init__.py` | `100.00` (**A**) | *(sin bloques)* | Bajo | Ninguna | **Cumplido (A)** |
| `app/utils/audit_context.py` | `100.00` (**A**) | `set_audit_context` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/utils/auth_dependency.py` | `94.88` (**A**) | `get_current_user` — **A (4)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/utils/db_errors.py` | `85.68` (**A**) | `extraer_mensaje_negocio` — **A (5)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/utils/jwt_utils.py` | `94.82` (**A**) | `decodificar_access_token` — **A (3)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/utils/response.py` | `67.93` (**A**) | `_orm_to_dict` — **C (17)**; `convertir_json` — **B (9)** | **Medio** | Separar `_serializar_con_lista_blanca` y `_serializar_generico` (requiere autorización) | **Cumplido MI (A) / Refactor CC C propuesto** |
| `app/utils/roles.py` | `95.75` (**A**) | `requiere_rol` — **A (1)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/utils/scheduler.py` | `95.30` (**A**) | `_job_actualizar_vencidos`, `iniciar_scheduler`, `detener_scheduler` — **A (2)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/utils/security.py` | `100.00` (**A**) | `verificar_contrasena` — **A (3)** | Bajo | Ninguna | **Cumplido (A)** |
| `app/utils/tiempo.py` | `73.96` (**A**) | `enriquecer_temporal` — **B (8)** | Bajo-Moderado | Ninguna inmediata (cobertura 100%) | **Cumplido (A)** |
| `app/utils/unidades.py` | `71.72` (**A**) | `validar_tiempo_alquiler_para_productos` — **A (5)** | Bajo | Ninguna | **Cumplido (A)** |

---

## 3. Análisis Detallado de Funciones con Complejidad Rango C

Aunque **ningún archivo obtuvo calificación C, D o F en Índice de Mantenibilidad**, tres funciones individuales superaron CC = 10 (rango **C**):

1. **`app/utils/response.py:42` — `_orm_to_dict` — CC `17` (Rango C)**
   - **Causa probable:** Doble ruta de serialización (lista blanca `__campos_publicos__` / `CAMPOS_PUBLICOS_POR_TABLA` vs inspección genérica de atributos ORM y `@property`) con múltiples comprensiones y condiciones anidadas de seguridad (`CAMPOS_SENSIBLES_EXCLUIDOS`).
   - **Riesgo:** Medio — función crítica de seguridad (`I-001` / `DXA-06`); cambios sin cuidado podrían alterar filtrado de `contrasena_usuario`.
   - **Recomendación:** Dividir en `_extraer_campos_whitelist(obj, campos_publicos)` y `_extraer_campos_orm_genericos(obj)`. **Requiere autorización previa.**

2. **`app/controllers/alquiler_controller.py:246` — `actualizar_alquiler` — CC `14` (Rango C)**
   - **Causa probable:** Concentra en una sola función la matriz de editabilidad por estado, validación de fecha de inicio en `pendiente`, ajuste/renovación/reducción de `tiempo_alquiler_dias` según estado, asignación de campos y manejo de `DBAPIError`.
   - **Riesgo:** Medio — es una de las reglas de negocio centrales del dominio (`RN` edición vs renovación).
   - **Recomendación:** Extraer `_validar_y_aplicar_tiempo_alquiler(db, alquiler, campos)`. **Requiere autorización previa.**

3. **`app/controllers/usuario_controller.py:90` — `actualizar_usuario` — CC `11` (Rango C)**
   - **Causa probable:** Validación secuencial de existencia, campos vacíos, unicidad de `telefono_usuario`, unicidad de `email_usuario`, re-hasheo condicional de `contrasena_usuario` y transacción con `set_audit_context`.
   - **Riesgo:** Bajo-Medio — lógica administrativa y de credenciales.
   - **Recomendación:** Extraer `_validar_unicidad_contacto_usuario(db, id_usuario, campos)`. **Requiere autorización previa.**
