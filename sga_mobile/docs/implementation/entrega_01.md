# Entrega 1 — Base del MVP móvil (datos simulados)

> **Autorización:** inicio del MVP con datos simulados (2026-11-21).
> **Estado:** entrega para revisión. No se amplía el alcance hasta aprobarla.

## Qué se implementó

- Proyecto Expo (SDK 58, React Native 0.88, TypeScript estricto) en `sga_mobile/`.
- Navegación principal con 4 secciones: **Inicio, Alquileres, Gastos, Historial**. Entregas y recogidas no son secciones del menú.
- **Inicio (funcional con mock):** alquileres vencidos, pendientes de entrega y próximos a vencer (≤ 2 días), con acceso al detalle.
- **Alquileres (funcional con mock):** listado, búsqueda por ID/cliente/dirección/barrio, filtros por estado, orden por vencimiento y detalle completo (cliente, alquiler, productos y cantidades).
- **Gastos e Historial:** solo diseño base. Muestran el alcance previsto y un aviso "no implementada".
- Capa de datos simulados independiente de las pantallas, con alquileres pendientes, activos, vencidos, recogido, terminado y **cancelados (que no aparecen)**.
- Estados de carga, error y vacío. Panel de pruebas para forzar los escenarios `normal / vacio / error`.
- Banner permanente que identifica el origen del dato (simulado / local / servidor).

## No implementado (aún)

- Autenticación y sesión (se asume un encargado logístico simulado).
- Mapa y ruta GPS (botones deshabilitados; falta decidir el proveedor).
- Registro de entregas y recogidas (los botones aplican la regla de disponibilidad, pero están deshabilitados).
- Gastos, resumen semanal, historial, cola de operaciones pendientes y sincronización.

## Arquitectura

```text
src/
├── types/        modelos (campos alineados con el SGA web; sin creador del alquiler)
├── domain/       lógica pura: reglas de estado, búsqueda, filtros, orden, fechas
├── data/mock/    datos simulados y escenario de pruebas
├── services/     interfaz AlquileresService + adaptador simulado; index.ts = único punto de sustitución por la API
├── hooks/        useAsync, useEscenarioMock
├── theme/        colores claro/oscuro
├── components/   UI reutilizable
├── navigation/   tabs + stack de Alquileres
└── screens/
```

Las pantallas dependen solo de `services/index.ts`. Para conectar la API se reemplaza ese adaptador sin tocar las pantallas.

## Dependencias de integración pendientes (no se inventaron)

| ID | Pendiente |
|---|---|
| DEP-INT-01 | `GET /alquileres` no devuelve teléfono ni tipo de documento del cliente: requiere `/clientes` o ampliar el contrato. |
| DEP-INT-02 | Contratos reales para móvil sin validar. El adaptador simulado no representa respuestas reales. |
| DEP-INT-03 | `POST /gastos` recibe `ids_alquiler` sin tipo de movimiento por asociación (entrega/recogida): el backend actual no lo soporta. |
| DEP-INT-04 | `valor_gasto_logistico` en BD permite 0; la regla exige valor positivo. |
| DEP-INT-05 | `GET /gastos/resumen-semanal` es solo `ADMIN_O_FACTURACION`; el móvil lo requiere para el logístico. |
| DEP-INT-06 | El backend permite registrar entrega en `activo`; la regla aprobada del móvil es solo `pendiente`. La app aplica la regla móvil. |
| DEP-INT-07 | Expiración del token sin conexión y renovación de token: **pendiente, sin solución definitiva** (no hay renovación en el backend). |
| DEP-INT-08 | Zona horaria: el móvil usa la del dispositivo; el negocio usa `America/Bogota`. |

## Verificación

- `npm run typecheck`: sin errores.
- `npm test` (9 pruebas de lógica de dominio y datos simulados): 9 correctas.
- Empaquetado Metro Android (`expo export`): correcto (868 módulos, bundle Hermes de 2 MB).
- **No se ejecutó en un dispositivo ni emulador**: la parte visual no está verificada en pantalla.

## Hallazgos

- Node v25.8.1 no está en el rango soportado por Expo 58 / RN 0.88 (`^22.13 || ^24.3 || >=26`). Solo hay avisos `EBADENGINE`. Se recomienda Node 22 o 24 LTS.
- `npm audit`: 3 vulnerabilidades moderadas en dependencias transitivas; sin tratar.
- Los documentos de `docs/` y los datos de `src/` describen el estado anterior de la Fase 2. Las contradicciones con la matriz original (RNM/RNF) siguen abiertas y no se resolvieron aquí.
