# Historias de Usuario — Módulo Logístico Móvil del SGA

> **Proyecto:** Sistema de Gestión de Alquileres (SGA) — Fundiplacas Rodríguez
> **Fase:** 2 — Historias de usuario, reglas de negocio, RNF y trazabilidad (cerrada)
> **Fecha de consolidación:** 2026-11-21
> **Actor principal:** Encargado logístico (EL)
> **Total de historias:** 18 (HU-01 a HU-18)

---

## HU-01 — Inicio de sesión

**Actor:** Encargado logístico
**Objetivo:** Autenticarse en la aplicación móvil para acceder a sus funcionalidades.

**Criterios de aceptación:**

1. La pantalla de inicio de sesión permite ingresar usuario (nombre de usuario o teléfono) y contraseña.
2. Al autenticarse correctamente, el token JWT se almacena de forma segura en el dispositivo.
3. La sesión persiste mientras el token sea válido; no se exige volver a iniciar sesión en cada uso.
4. Si las credenciales son incorrectas, se muestra un mensaje de error claro sin exponer información sensible.
5. Si el usuario está desactivado en el sistema, se muestra un mensaje apropiado.
6. Al cerrar sesión, se eliminan del dispositivo las credenciales y la información privada de la sesión.

---

## HU-02 — Consultar listado de alquileres

**Actor:** Encargado logístico
**Objetivo:** Consultar la lista de alquileres disponibles para planificar y ejecutar operaciones logísticas.

**Criterios de aceptación:**

1. La pantalla muestra un listado de alquileres cargado desde la API o desde el almacenamiento local si no hay conexión.
2. Cada elemento del listado muestra información suficiente para identificar el alquiler (identificador, estado, cliente o referencia del destino).
3. El listado incluye funcionalidad de búsqueda por texto.
4. El listado incluye funcionalidad de filtros (al menos por estado).
5. Al seleccionar un alquiler del listado, se navega al detalle correspondiente (HU-03).
6. Si no hay conexión, se muestra el listado de datos descargados previamente con indicación del estado offline.
7. Si no hay datos disponibles (ni en línea ni en caché), se muestra un estado vacío informativo.

---

## HU-03 — Consultar detalle de alquiler

**Actor:** Encargado logístico
**Objetivo:** Consultar información del cliente, ubicación de la obra, productos, duración y valores necesarios para las operaciones logísticas.

**Criterios de aceptación:**

1. Seleccionar un alquiler en el listado abre el detalle correspondiente.
2. Mostrar identificador y estado actual.
3. Mostrar precio total y depósito.
4. Mostrar nombres y apellidos, teléfono y número de documento del cliente.
5. Mostrar fecha de inicio, vencimiento y duración en días o semanas.
6. Mostrar dirección, barrio y modalidad logística.
7. Mostrar productos, cantidades, nombre, precio por unidad de tiempo y precio conjunto.
8. Permitir consultar la ubicación en el mapa y acceder a las funcionalidades de ruta definidas para el módulo (HU-04, HU-05).
9. No mostrar el empleado que creó o gestionó administrativamente el alquiler.
10. Mostrar únicamente el estado actual, sin historial de movimientos.

**Referencia visual:** tarjeta principal con identificador, estado, precio del alquiler y depósito; secciones de cliente, alquiler y productos; acción para consultar el mapa. Contemplar modo claro y oscuro.

---

## HU-04 — Visualizar ubicación de entrega en el mapa

**Actor:** Encargado logístico
**Objetivo:** Visualizar el destino de entrega en un mapa dentro de la aplicación.

**Criterios de aceptación:**

1. Acceso desde el detalle del alquiler.
2. Mostrar un marcador del destino en el mapa.
3. Mostrar una tarjeta con dirección y barrio.
4. Permitir ampliar, reducir y desplazar el mapa.
5. Si no se encuentra la dirección exacta, intentar localizar el barrio y comunicar que no se encontró la dirección registrada.
6. Si dirección y barrio no coinciden, la dirección tiene prioridad. Si la dirección no puede utilizarse, se puede recurrir al barrio cuando esté disponible.
7. Si no hay conexión o falla el servicio de mapas, no mostrar el mapa y comunicar el error de conexión.
8. La funcionalidad debe permanecer dentro de la aplicación, sin abrir aplicaciones externas.

> [!NOTE]
> HU-04 corresponde exclusivamente a la visualización del destino en el mapa. La ubicación actual del usuario y el cálculo de ruta GPS pertenecen a HU-05.

---

## HU-05 — Consultar ruta GPS

**Actor:** Encargado logístico
**Objetivo:** Obtener una ruta de navegación desde su ubicación actual hasta el destino del alquiler.

**Criterios de aceptación:**

1. Acceso desde la pantalla del mapa (HU-04) o desde el detalle del alquiler.
2. Muestra la ubicación actual del encargado logístico en el mapa.
3. Calcula y muestra una ruta desde la ubicación actual hasta el destino del alquiler.
4. Si se deniega el permiso de ubicación, se muestra un mensaje informativo y la ruta GPS no bloquea el resto de la aplicación.
5. Si no hay conexión, se comunica el error sin bloquear otras funcionalidades.

---

## HU-06 — Registrar entrega

**Actor:** Encargado logístico
**Objetivo:** Registrar que el equipamiento de un alquiler ha sido entregado en la obra.

**Criterios de aceptación:**

1. Acceso desde el detalle del alquiler, disponible para alquileres en estado pendiente.
2. La entrega es completa; no existe entrega parcial.
3. El encargado logístico puede registrar una observación opcional.
4. No se solicitan datos adicionales del receptor de la entrega.
5. La fecha, hora y usuario de la entrega se registran automáticamente; el encargado logístico no los introduce manualmente.
6. Al registrar la entrega con conexión, se envía a la API y se muestra confirmación.
7. Si no hay conexión, la entrega se almacena como operación pendiente y se sincroniza automáticamente al recuperar la conexión (HU-17).
8. Se muestra el estado de la operación (enviada / pendiente de sincronización).

---

## HU-07 — Registrar recogida

**Actor:** Encargado logístico
**Objetivo:** Registrar que el equipamiento de un alquiler ha sido recogido de la obra.

**Criterios de aceptación:**

1. Acceso desde el detalle del alquiler, disponible para alquileres en estado activo o vencido.
2. El encargado logístico puede registrar una observación (incluye descripción de daños, faltantes o novedades si los hubiera).
3. La fecha, hora y usuario de la recogida se registran automáticamente.
4. No se exige al encargado logístico un registro de autorización previa de facturación para realizar la recogida.
5. Los ajustes de inventario derivados de daños o faltantes son gestionados manualmente por el administrador; no se gestionan desde la aplicación móvil.
6. Al registrar la recogida con conexión, se envía a la API y se muestra confirmación.
7. Si no hay conexión, la recogida se almacena como operación pendiente y se sincroniza automáticamente al recuperar la conexión (HU-18).
8. Se muestra el estado de la operación (enviada / pendiente de sincronización).

---

## HU-08 — Registrar gasto logístico

**Actor:** Encargado logístico
**Objetivo:** Registrar un gasto operativo relacionado con la logística de campo.

**Criterios de aceptación:**

1. Acceso desde la sección de gastos.
2. El formulario incluye al menos: descripción del gasto y valor.
3. Los gastos no tienen categorías predefinidas obligatorias.
4. No existe un límite de gasto establecido en las decisiones aprobadas.
5. La fecha y el usuario del gasto se registran automáticamente.
6. Al registrar con conexión, se envía a la API y se muestra confirmación.
7. Si no hay conexión, el gasto se almacena como operación pendiente y se sincroniza automáticamente al recuperar la conexión (HU-16).
8. Se muestra el estado del gasto (enviado / pendiente de sincronización).

---

## HU-09 — Consultar gastos propios

**Actor:** Encargado logístico
**Objetivo:** Consultar los gastos logísticos que ha registrado.

**Criterios de aceptación:**

1. La pantalla muestra el listado de gastos registrados por el encargado logístico autenticado.
2. Cada elemento muestra al menos: descripción, valor y fecha.
3. El encargado logístico no edita ni elimina gastos desde la aplicación.
4. Si no hay conexión, se muestran los gastos disponibles en el almacenamiento local con indicación del estado offline.

---

## HU-10 — Consultar resumen semanal de gastos

**Actor:** Encargado logístico
**Objetivo:** Consultar un resumen de sus gastos agrupados por semana.

**Criterios de aceptación:**

1. La pantalla muestra un resumen de gastos agrupado por semana.
2. Cada semana muestra al menos: período, cantidad de registros y total de gastos.
3. La información proviene de la API cuando hay conexión.
4. Si no hay conexión, se muestran los datos disponibles en el almacenamiento local.

> [!NOTE]
> Pendiente de validación técnica: en el SGA actual, el endpoint `GET /gastos/resumen-semanal` está restringido a `ADMIN_O_FACTURACION`. Si la primera versión del módulo móvil requiere que el encargado logístico acceda a su propio resumen semanal, se necesita un cambio en el backend o un nuevo endpoint. Esta dependencia debe resolverse en la Fase 6 (Integración con API).

---

## HU-11 — Consultar historial de movimientos

**Actor:** Encargado logístico
**Objetivo:** Consultar el historial de sus propias operaciones logísticas (entregas, recogidas, gastos).

**Criterios de aceptación:**

1. La pantalla muestra el historial de movimientos realizados por el encargado logístico autenticado.
2. Incluye entregas, recogidas y gastos con fecha, tipo de operación y referencia del alquiler o descripción.
3. El historial corresponde únicamente a las operaciones propias; la consulta general corresponde al sistema web.
4. Si no hay conexión, se muestran los movimientos disponibles en el almacenamiento local.

---

## HU-12 — Consultar información sin conexión

**Actor:** Encargado logístico
**Objetivo:** Consultar información de alquileres y datos relevantes cuando no hay conexión a internet.

**Criterios de aceptación:**

1. Cuando no hay conexión, la aplicación muestra los datos descargados previamente (alquileres, detalles, gastos, historial).
2. Se indica claramente que la información proviene del caché local y puede no estar actualizada.
3. Las funcionalidades de registro (entregas, recogidas, gastos) siguen disponibles en modo offline (HU-13, HU-14, HU-15).
4. No se muestra información falsa o fabricada; si no hay datos en caché, se comunica claramente.

---

## HU-13 — Registrar gastos sin conexión

**Actor:** Encargado logístico
**Objetivo:** Registrar un gasto logístico cuando no hay conexión a internet.

**Criterios de aceptación:**

1. El formulario de registro de gasto (HU-08) está disponible sin conexión.
2. El gasto registrado sin conexión se almacena localmente como operación pendiente.
3. Se muestra al encargado logístico que el gasto quedó pendiente de sincronización.
4. El gasto se sincroniza automáticamente al recuperar la conexión (HU-16).

---

## HU-14 — Registrar entregas sin conexión

**Actor:** Encargado logístico
**Objetivo:** Registrar una entrega cuando no hay conexión a internet.

**Criterios de aceptación:**

1. El formulario de registro de entrega (HU-06) está disponible sin conexión.
2. La entrega registrada sin conexión se almacena localmente como operación pendiente.
3. Se muestra al encargado logístico que la entrega quedó pendiente de sincronización.
4. La entrega se sincroniza automáticamente al recuperar la conexión (HU-17).

---

## HU-15 — Registrar recogidas sin conexión

**Actor:** Encargado logístico
**Objetivo:** Registrar una recogida cuando no hay conexión a internet.

**Criterios de aceptación:**

1. El formulario de registro de recogida (HU-07) está disponible sin conexión.
2. La recogida registrada sin conexión se almacena localmente como operación pendiente.
3. Se muestra al encargado logístico que la recogida quedó pendiente de sincronización.
4. La recogida se sincroniza automáticamente al recuperar la conexión (HU-18).

---

## HU-16 — Sincronizar gastos

**Actor:** Encargado logístico
**Objetivo:** Enviar al sistema los gastos registrados sin conexión.

**Criterios de aceptación:**

1. Al recuperar la conexión, la aplicación intenta sincronizar automáticamente los gastos pendientes.
2. El encargado logístico puede iniciar manualmente la sincronización de gastos pendientes.
3. Se muestra el estado de cada gasto pendiente (en espera, sincronizando, sincronizado, error).
4. Si la sincronización falla, el gasto permanece como pendiente y el encargado logístico puede reintentar manualmente.
5. Las operaciones pendientes persisten aunque se cierre y vuelva a abrir la aplicación.

---

## HU-17 — Sincronizar entregas

**Actor:** Encargado logístico
**Objetivo:** Enviar al sistema las entregas registradas sin conexión.

**Criterios de aceptación:**

1. Al recuperar la conexión, la aplicación intenta sincronizar automáticamente las entregas pendientes.
2. El encargado logístico puede iniciar manualmente la sincronización de entregas pendientes.
3. Se muestra el estado de cada entrega pendiente (en espera, sincronizando, sincronizada, error).
4. Si la sincronización falla, la entrega permanece como pendiente y el encargado logístico puede reintentar manualmente.
5. Las operaciones pendientes persisten aunque se cierre y vuelva a abrir la aplicación.

---

## HU-18 — Sincronizar recogidas

**Actor:** Encargado logístico
**Objetivo:** Enviar al sistema las recogidas registradas sin conexión.

**Criterios de aceptación:**

1. Al recuperar la conexión, la aplicación intenta sincronizar automáticamente las recogidas pendientes.
2. El encargado logístico puede iniciar manualmente la sincronización de recogidas pendientes.
3. Se muestra el estado de cada recogida pendiente (en espera, sincronizando, sincronizada, error).
4. Si la sincronización falla, la recogida permanece como pendiente y el encargado logístico puede reintentar manualmente.
5. Las operaciones pendientes persisten aunque se cierre y vuelva a abrir la aplicación.

---

## Resumen de historias de usuario

| ID | Nombre | Grupo | Estado |
|---|---|---|---|
| HU-01 | Inicio de sesión | Autenticación | Aprobada |
| HU-02 | Consultar listado de alquileres | Alquileres | Aprobada |
| HU-03 | Consultar detalle de alquiler | Alquileres | Aprobada |
| HU-04 | Visualizar ubicación de entrega en el mapa | Ubicación | Aprobada |
| HU-05 | Consultar ruta GPS | Ubicación | Aprobada |
| HU-06 | Registrar entrega | Entregas | Aprobada |
| HU-07 | Registrar recogida | Recogidas | Aprobada |
| HU-08 | Registrar gasto logístico | Gastos | Aprobada |
| HU-09 | Consultar gastos propios | Gastos | Aprobada |
| HU-10 | Consultar resumen semanal de gastos | Gastos | Aprobada (⚠️ pendiente de validación técnica de endpoint) |
| HU-11 | Consultar historial de movimientos | Historial | Aprobada |
| HU-12 | Consultar información sin conexión | Offline | Aprobada |
| HU-13 | Registrar gastos sin conexión | Offline | Aprobada |
| HU-14 | Registrar entregas sin conexión | Offline | Aprobada |
| HU-15 | Registrar recogidas sin conexión | Offline | Aprobada |
| HU-16 | Sincronizar gastos | Sincronización | Aprobada |
| HU-17 | Sincronizar entregas | Sincronización | Aprobada |
| HU-18 | Sincronizar recogidas | Sincronización | Aprobada |

---

*Documento consolidado el 2026-11-21. Fase 2 cerrada.*
