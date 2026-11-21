# Reglas de Negocio — Módulo Logístico Móvil del SGA

> **Proyecto:** Sistema de Gestión de Alquileres (SGA) — Fundiplacas Rodríguez
> **Fase:** 2 — Historias de usuario, reglas de negocio, RNF y trazabilidad (cerrada)
> **Fecha de consolidación:** 2026-11-21
> **Fuente:** Instrucción aprobada de consolidación documental del módulo logístico móvil

---

> [!IMPORTANT]
> Las reglas registradas en este documento están aprobadas para el módulo logístico móvil. No modificar unilateralmente su contenido. Las reglas marcadas como pendientes de validación técnica deben resolverse con el propietario antes de implementarse.

---

## 1. Autenticación y sesión

| ID | Regla | Estado |
|---|---|---|
| RN-MOV-01 | El inicio de sesión acepta usuario (nombre de usuario o teléfono) y contraseña. | Aprobada |
| RN-MOV-02 | La sesión persiste en el dispositivo mientras el token JWT sea válido. | Aprobada |
| RN-MOV-03 | El cierre de sesión elimina del dispositivo las credenciales e información privada de la sesión. | Aprobada |
| RN-MOV-04 | Un usuario desactivado en el sistema no puede iniciar sesión en la aplicación móvil. | Aprobada (hereda de RN-AUTH-02 del SGA) |
| RN-MOV-05 | El rol `cliente` no tiene acceso a la aplicación móvil. | Aprobada (hereda de RN-AUTH-01 del SGA) |

---

## 2. Actor y versión

| ID | Regla | Estado |
|---|---|---|
| RN-MOV-06 | La primera versión del módulo logístico móvil está dirigida exclusivamente al encargado logístico. | Aprobada |
| RN-MOV-07 | El encargado logístico no crea ni modifica alquileres desde la aplicación móvil. | Aprobada |
| RN-MOV-08 | El encargado logístico no crea ni modifica clientes desde la aplicación móvil. | Aprobada |
| RN-MOV-09 | El encargado logístico no crea ni modifica renovaciones desde la aplicación móvil. | Aprobada |
| RN-MOV-10 | El encargado logístico no edita ni elimina gastos desde la aplicación móvil. | Aprobada |
| RN-MOV-11 | El encargado logístico no accede al historial de auditoría completo del sistema desde la aplicación móvil. | Aprobada |
| RN-MOV-12 | El encargado logístico consulta únicamente sus propios movimientos (gastos, entregas, recogidas). La consulta general corresponde al sistema web. | Aprobada |

---

## 3. Entregas

| ID | Regla | Estado |
|---|---|---|
| RN-MOV-13 | La entrega de un alquiler es completa. No existe entrega parcial en la primera versión. | Aprobada |
| RN-MOV-14 | No se solicitan datos adicionales del receptor de la entrega. | Aprobada |
| RN-MOV-15 | Los datos de fecha, hora y usuario de la entrega se gestionan automáticamente. El encargado logístico no los introduce manualmente. | Aprobada |
| RN-MOV-16 | La entrega se registra para alquileres en estado `pendiente`. | Aprobada (hereda de RN-AUD-19 del SGA) |

---

## 4. Recogidas

| ID | Regla | Estado |
|---|---|---|
| RN-MOV-17 | La recogida puede registrarse para alquileres en estado `activo` o `vencido`. | Aprobada (hereda de RN-LOG-04 del SGA) |
| RN-MOV-18 | El encargado logístico puede realizar la recogida sin que se le exija un registro de autorización previa de facturación. | Aprobada |
| RN-MOV-19 | Los daños, faltantes y novedades se describen en el campo de observaciones de la recogida. | Aprobada |
| RN-MOV-20 | Los ajustes de inventario derivados de daños o faltantes son gestionados manualmente por el administrador. No se gestionan desde la aplicación móvil. | Aprobada |
| RN-MOV-21 | Los datos de fecha, hora y usuario de la recogida se gestionan automáticamente. El encargado logístico no los introduce manualmente. | Aprobada |

---

## 5. Gastos

| ID | Regla | Estado |
|---|---|---|
| RN-MOV-22 | Los gastos corresponden a gastos logísticos generales. | Aprobada |
| RN-MOV-23 | Los gastos no tienen categorías predefinidas obligatorias. | Aprobada |
| RN-MOV-24 | No existe un límite de gasto establecido en las decisiones aprobadas. | Aprobada |
| RN-MOV-25 | Los datos de fecha y usuario del gasto se gestionan automáticamente. | Aprobada |
| RN-MOV-26 | El encargado logístico no edita ni elimina gastos registrados desde la aplicación móvil. | Aprobada |

---

## 6. Visualización del detalle de alquiler

| ID | Regla | Estado |
|---|---|---|
| RN-MOV-27 | El detalle del alquiler no muestra el empleado que creó o gestionó administrativamente el alquiler. | Aprobada |
| RN-MOV-28 | El detalle del alquiler muestra únicamente el estado actual, sin historial de movimientos. | Aprobada |

---

## 7. Mapa y GPS

| ID | Regla | Estado |
|---|---|---|
| RN-MOV-29 | La visualización del destino en el mapa se realiza dentro de la aplicación, sin abrir aplicaciones externas. | Aprobada |
| RN-MOV-30 | Si la dirección exacta no se encuentra, se intenta localizar el barrio y se comunica al usuario que la dirección registrada no pudo localizarse. | Aprobada |
| RN-MOV-31 | Si dirección y barrio no coinciden, la dirección tiene prioridad. Si la dirección no puede utilizarse, se recurre al barrio cuando esté disponible. | Aprobada |
| RN-MOV-32 | Si no hay conexión o falla el servicio de mapas, no se muestra el mapa y se comunica el error. | Aprobada |
| RN-MOV-33 | El uso de mapas y GPS no bloquea el resto de la aplicación si se deniega el permiso de ubicación. | Aprobada |

---

## 8. Offline y sincronización

| ID | Regla | Estado |
|---|---|---|
| RN-MOV-34 | Las operaciones pendientes (gastos, entregas, recogidas registrados sin conexión) se almacenan localmente y persisten aunque se cierre y vuelva a abrir la aplicación. | Aprobada |
| RN-MOV-35 | La sincronización de operaciones pendientes es automática al recuperar la conexión. | Aprobada |
| RN-MOV-36 | El encargado logístico puede iniciar manualmente la sincronización de operaciones pendientes. | Aprobada |
| RN-MOV-37 | Si una sincronización falla, la operación permanece como pendiente y puede reintentarse manualmente. | Aprobada |
| RN-MOV-38 | La aplicación muestra claramente el estado de cada operación (enviada / pendiente / error). | Aprobada |

---

## 9. Reglas heredadas del SGA que aplican al módulo móvil

Las siguientes reglas están implementadas en el backend del SGA y aplican también al módulo móvil. No se reimplementan en la app: se respetan como restricciones del sistema.

| ID SGA | Descripción resumida | Referencia |
|---|---|---|
| RN-AUD-19 | La entrega transiciona el alquiler de `pendiente` a `activo`. | `DXC-2026-005` §6.2 |
| RN-LOG-04 | La recogida exige entrega previa y solo aplica a alquileres `activo` o `vencido`. Transiciona a `recogido`. | `DXC-2026-005` §6.1 |
| RN-AUD-20 | El gasto puede asociarse a uno o varios alquileres (viaje multiequipo). | `DXC-2026-005` §6.3 |
| RN-AUD-22 | La identidad del usuario siempre se toma del JWT; nunca se recibe del cliente. | `DXC-2026-005` §7.5 |
| RN-AUTH-01 | El rol `cliente` no accede al sistema. | `DXC-2026-005` §7.1 |
| RN-AUTH-02 | Un usuario desactivado no puede iniciar sesión. | `DXC-2026-005` §7.2 |

> [!NOTE]
> La regla RN-LOG-04 del SGA establece que la recogida exige entrega previa. Esta restricción la aplica el backend. Si en el contexto del módulo móvil se requiere una recogida sin entrega previa (por ejemplo, cancelación de operación), debe validarse con el propietario y el backend antes de implementar.

---

## 10. Dependencias y pendientes de validación técnica

| ID | Descripción | Impacto |
|---|---|---|
| DEP-MOV-01 | El endpoint `GET /gastos/resumen-semanal` está restringido en el SGA actual a `ADMIN_O_FACTURACION`. Si la app móvil requiere que el encargado logístico consulte su propio resumen semanal, se necesita un cambio en el backend o un nuevo endpoint. | HU-10 |
| DEP-MOV-02 | El endpoint de historial de movimientos propios del encargado logístico puede no existir de forma filtrada en el SGA actual. Validar si el endpoint `GET /gastos` y los de entregas/recogidas son suficientes o se necesita un endpoint consolidado. | HU-11 |
| DEP-MOV-03 | La consideración de idempotencia en las operaciones de sincronización (evitar duplicados al reintentar una operación fallida) debe validarse con el backend antes de implementar la lógica de reintento. | HU-16, HU-17, HU-18 |

---

*Documento consolidado el 2026-11-21. Fase 2 cerrada.*
