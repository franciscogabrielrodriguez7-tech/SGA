# Arquitectura — Módulo Logístico Móvil del SGA

> **Proyecto:** Sistema de Gestión de Alquileres (SGA) — Fundiplacas Rodríguez
> **Fase:** 3 — Arquitectura móvil (cerrada)
> **Fecha de consolidación:** 2026-11-21
> **Fuente:** Instrucción aprobada de consolidación documental del módulo logístico móvil

---

> [!NOTE]
> Este documento describe la arquitectura **aprobada** del módulo logístico móvil. No es una autorización para implementar la aplicación. Los ADR y elementos de arquitectura se consolidan con los identificadores aprobados (ADR-001 a ADR-016, AD-01 a AD-13); el contenido detallado de cada uno refleja lo disponible en la instrucción. Los ADR cuyo contenido completo no ha sido proporcionado como fuente independiente se registran con su identificador y el contenido disponible, indicando la pendencia.

---

## 1. Visión general de la arquitectura

El módulo logístico móvil adopta una **arquitectura híbrida**: módulos por funcionalidad en la capa de presentación y capas por responsabilidad en la capa de datos y servicios.

```
┌─────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN (React Native / Expo)             │
│  Pantallas organizadas por módulo de funcionalidad      │
│  Modo claro / oscuro · Orientación principalmente       │
│  vertical · Dispositivos gama baja y media              │
└────────────────────┬────────────────────────────────────┘
                     │ (no solicitudes HTTP directas desde pantallas)
┌────────────────────▼────────────────────────────────────┐
│  CAPA DE SERVICIOS Y LÓGICA                             │
│  Servicios API organizados por módulo                   │
│  Cliente HTTP centralizado                              │
│  Manejo de autenticación (token JWT)                    │
│  Gestión de operaciones pendientes (cola offline)       │
│  Lógica de sincronización                               │
└───────┬──────────────────────────┬──────────────────────┘
        │                          │
┌───────▼──────────┐   ┌───────────▼──────────────────────┐
│  ALMACENAMIENTO  │   │  API CENTRAL DEL SGA              │
│  LOCAL SEGURO    │   │  FastAPI · /api/sga               │
│  Caché de datos  │   │  Backend existente (no modificado)│
│  Cola de pendien.│   │  Autenticación JWT                │
│  Sesión segura   │   └──────────────────────────────────┘
└──────────────────┘
        │
┌───────▼──────────────────────────────────────────────────┐
│  SERVICIOS EXTERNOS                                      │
│  Mapas (geocodificación, visualización de mapa)          │
│  GPS (ubicación actual, cálculo de ruta)                 │
└──────────────────────────────────────────────────────────┘
```

## 2. Principios de arquitectura

| Principio | Descripción |
|---|---|
| Separación de responsabilidades | Las pantallas no ejecutan directamente solicitudes HTTP ni manipulan la base de datos local. Delegan en la capa de servicios. |
| Cliente HTTP centralizado | Todas las comunicaciones con la API del SGA pasan por un único cliente HTTP configurado (token, base URL, manejo de errores). |
| Servicios API por módulo | Los servicios de comunicación con la API están organizados por módulo funcional (alquileres, gastos, logística, auth). |
| Almacenamiento seguro | Las credenciales, el token JWT y la información privada de sesión se almacenan en el almacenamiento seguro del dispositivo (keychain/keystore). |
| Independencia del frontend web | La aplicación móvil es un cliente independiente de la API. No comparte código con el frontend web (`sga_frontend_jwt/`). |
| Backend y BD sin modificación | El backend y la base de datos del SGA no se modifican para la primera versión del módulo móvil, salvo los cambios expresamente aprobados como dependencias. |

## 3. Decisiones de arquitectura (ADR)

> [!NOTE]
> Los identificadores ADR-001 a ADR-016 están aprobados. El contenido completo de cada ADR como documento independiente no ha sido proporcionado como fuente separada. Se consolida a continuación el contenido disponible en la instrucción aprobada. Los ADR cuyo contenido detallado no esté aquí deben completarse con el documento fuente original del propietario.

### ADR-001 — Arquitectura híbrida (módulos + capas)

**Decisión:** Adoptar una arquitectura híbrida que combine módulos por funcionalidad en la capa de presentación y capas por responsabilidad en los servicios y la persistencia.

**Justificación:** Permite organizar el código por dominio de negocio (alquileres, gastos, logística) mientras se mantiene una separación clara de responsabilidades entre UI, servicios y datos.

---

### ADR-002 — Aplicación móvil independiente dentro de `sga_mobile/`

**Decisión:** El módulo logístico móvil reside en la carpeta `sga_mobile/` del repositorio del SGA como unidad independiente, con su propia documentación, estructura, dependencias y configuración cuando llegue la etapa de implementación.

**Justificación:** Mantiene la separación entre el sistema web existente y el nuevo módulo móvil, evitando interferencias y facilitando la gestión independiente de cada componente.

---

### ADR-003 — Frontend web y móvil como clientes separados de la API FastAPI

**Decisión:** El frontend web (`sga_frontend_jwt/`) y la aplicación móvil (`sga_mobile/`) son dos clientes independientes de la misma API central (`/api/sga`). No comparten código fuente.

**Justificación:** Permite que cada cliente evolucione de forma independiente según sus necesidades específicas de plataforma.

---

### ADR-004 — Uso de servicios externos de mapas y GPS

**Decisión:** La visualización del mapa y el cálculo de ruta se delegan a servicios externos de mapas. La aplicación no implementa cartografía propia.

**Restricciones aprobadas:**
- El permiso de GPS denegado no bloquea el resto de la aplicación.
- El mapa se muestra dentro de la aplicación sin abrir apps externas.
- Si el servicio falla o no hay conexión, se comunica el error sin bloquear otras funcionalidades.

---

### ADR-005 — Almacenamiento seguro del dispositivo

**Decisión:** Las credenciales, el token JWT y la información privada de sesión se almacenan exclusivamente en el almacenamiento seguro del dispositivo (iOS Keychain / Android Keystore).

---

### ADR-006 — Cliente HTTP centralizado

**Decisión:** Toda comunicación con la API del SGA pasa por un único cliente HTTP centralizado que gestiona la autenticación (inyección del token JWT), la URL base, el manejo de errores y los reintentos.

**Consecuencia:** Las pantallas y los servicios de módulo no instancian clientes HTTP propios.

---

### ADR-007 — Servicios API organizados por módulo

**Decisión:** Los servicios de comunicación con la API se organizan en módulos funcionales (p. ej. `alquileresService`, `gastosService`, `logisticaService`, `authService`).

---

### ADR-008 — Las pantallas no ejecutan solicitudes HTTP ni manipulan la BD local directamente

**Decisión:** Las pantallas son responsables únicamente de la presentación y la interacción del usuario. Delegan toda lógica de datos (consultas, escrituras, sincronización) en la capa de servicios.

---

### ADR-009 — Manejo de autenticación

**Decisión:** La autenticación usa el endpoint `POST /api/sga/auth/login` del SGA. El token JWT resultante se almacena de forma segura y se inyecta automáticamente en todas las solicitudes autenticadas a través del cliente HTTP centralizado.

**Sesión:** Persiste mientras el token sea válido. Al expirar, se solicita nuevo inicio de sesión.

---

### ADR-010 — Persistencia local de datos consultados (caché offline)

**Decisión:** Los datos consultados con conexión (alquileres, detalles, gastos, historial) se almacenan localmente para permitir la consulta sin conexión.

**Alcance:** Solo los datos que el dispositivo ha descargado previamente. No se inventan datos ni se muestran datos falsos cuando no hay caché.

---

### ADR-011 — Cola de operaciones pendientes

**Decisión:** Las operaciones registradas sin conexión (entregas, recogidas, gastos) se almacenan en una cola local persistente. Esta cola sobrevive al cierre de la aplicación.

**Estado de operación:** Cada operación en la cola tiene un estado: en espera, sincronizando, sincronizada, error.

---

### ADR-012 — Sincronización automática y manual

**Decisión:** La sincronización de operaciones pendientes es automática al detectar conexión disponible. También puede iniciarse manualmente por el usuario.

---

### ADR-013 — Reintento manual de operaciones fallidas

**Decisión:** Si una operación de sincronización falla, permanece en la cola con estado de error. El encargado logístico puede reintentar manualmente.

---

### ADR-014 — Consideraciones de idempotencia y estados de sincronización

**Decisión:** El diseño de la sincronización debe contemplar la idempotencia para evitar duplicados al reintentar operaciones fallidas.

**Pendiente de validación técnica (DEP-MOV-03):** La estrategia concreta de idempotencia (identificadores de cliente, verificación de estado en el backend, etc.) debe acordarse con el backend en la Fase 6 (Integración con API).

---

### ADR-015 — Tecnología prevista: React Native con Expo

**Decisión:** La aplicación móvil se implementará con React Native y Expo, con soporte para Android e iOS.

**Estado:** Decisión de tecnología aprobada. No se inicializa el proyecto en esta fase documental.

---

### ADR-016 — Dependencias y cambios potenciales requeridos en el backend

**Decisión:** Los cambios necesarios en el backend del SGA para soportar el módulo móvil se documentan como dependencias explícitas (DEP-MOV-01, DEP-MOV-02, DEP-MOV-03) y requieren aprobación y auditoría antes de implementarse.

**Principio:** La primera versión del módulo móvil no modifica el backend existente salvo autorización expresa.

---

## 4. Elementos de arquitectura (AD)

> [!NOTE]
> Los identificadores AD-01 a AD-13 están referenciados en la instrucción aprobada. Se consolida a continuación el mapeo con los elementos de arquitectura descritos. El contenido detallado de cada elemento como especificación técnica queda pendiente para la Fase 6 (Integración con API) y la Fase 7 (Backlog técnico).

| ID | Elemento | Descripción |
|---|---|---|
| AD-01 | Pantallas de autenticación | Inicio de sesión, gestión de sesión, cierre de sesión |
| AD-02 | Pantalla de inicio (Home) | Acceso rápido a funcionalidades principales |
| AD-03 | Pantallas de listado y búsqueda de alquileres | Listado con búsqueda y filtros |
| AD-04 | Pantalla de detalle del alquiler | Información completa del alquiler para operaciones de campo |
| AD-05 | Pantalla de mapa | Visualización del destino; integración con servicio de mapas externo |
| AD-06 | Componente GPS / ruta | Ubicación actual y cálculo de ruta; integración con servicio GPS externo |
| AD-07 | Pantallas de registro de entrega y recogida | Formularios de operaciones logísticas |
| AD-08 | Pantallas de gastos | Registro y consulta de gastos; resumen semanal |
| AD-09 | Pantalla de historial | Historial de movimientos propios |
| AD-10 | Cliente HTTP centralizado | Comunicación con la API del SGA; gestión de token y errores |
| AD-11 | Servicios API por módulo | `authService`, `alquileresService`, `gastosService`, `logisticaService` |
| AD-12 | Almacenamiento local | Caché de datos consultados; cola de operaciones pendientes; sesión segura |
| AD-13 | Módulo de sincronización | Detección de conexión; envío de cola pendiente; gestión de estados y reintentos |

---

## 5. Dependencias con el backend del SGA

Las siguientes situaciones requieren validación o cambios en el backend antes de implementar las funcionalidades correspondientes:

| ID | Dependencia | HU relacionada | Estado |
|---|---|---|---|
| DEP-MOV-01 | `GET /gastos/resumen-semanal` está restringido a `ADMIN_O_FACTURACION`. Si la app móvil requiere que el encargado logístico consulte su propio resumen, se necesita un cambio o nuevo endpoint. | HU-10 | Pendiente de validación — Fase 6 |
| DEP-MOV-02 | Validar si los endpoints existentes de gastos, entregas y recogidas son suficientes para el historial de movimientos propios, o si se necesita un endpoint consolidado. | HU-11 | Pendiente de validación — Fase 6 |
| DEP-MOV-03 | Estrategia de idempotencia para reintentos de sincronización (evitar duplicados). | HU-16, HU-17, HU-18 | Pendiente de validación — Fase 6 |

> [!WARNING]
> El hecho de que un endpoint exista en el SGA actual no garantiza que sea adecuado para el módulo móvil sin validación previa. No afirmar que una integración está implementada solamente porque aparece en el diseño.

---

## 6. Referencia del SGA existente

Para entender qué está disponible en la API actual del SGA, consultar:

- `docs/architecture/architecture_map.md` — Mapa de arquitectura verificado del SGA web (HEAD `cefb92df`, 2026-11-20)
- `docs/gestion_proyecto/04_diagnostico/DXC-2026-005_reglas_negocio_rbac.md` — Reglas de negocio y RBAC

---

*Documento consolidado el 2026-11-21. Fase 3 cerrada.*
