# Análisis y Diseño — Módulo Logístico Móvil del SGA

> **Proyecto:** Sistema de Gestión de Alquileres (SGA) — Fundiplacas Rodríguez
> **Fase:** 1 — Ficha de análisis de funcionalidad móvil (cerrada)
> **Fecha de consolidación:** 2026-11-21
> **Fuente:** Instrucción aprobada de consolidación documental del módulo logístico móvil

---

## 1. Propósito

El módulo logístico móvil del SGA tiene como propósito proveer al encargado logístico de Fundiplacas Rodríguez una herramienta de campo que le permita consultar, registrar y sincronizar operaciones logísticas (entregas, recogidas, gastos) desde un dispositivo móvil Android o iOS, con soporte para operación en entornos sin conexión a internet.

## 2. Problema que busca resolver

El encargado logístico realiza su trabajo en las obras, fuera de la oficina, sin acceso permanente al sistema web del SGA. Las operaciones que debe registrar —entregas, recogidas y gastos de campo— requieren acceso a información del alquiler (cliente, dirección, productos, duración) y la posibilidad de registrar eventos en tiempo real o diferido cuando no hay conexión.

La ausencia de una herramienta móvil obliga a procesos manuales o a depender del sistema web desde la oficina, generando retrasos en el registro y posibles errores en la trazabilidad de operaciones logísticas.

## 3. Alcance

### 3.1 Dentro del alcance

- Consulta del listado de alquileres con búsqueda y filtros.
- Consulta del detalle de un alquiler: cliente, dirección, productos, duración, valores.
- Visualización de la ubicación de entrega en un mapa dentro de la aplicación.
- Acceso a ruta GPS hacia el destino.
- Registro de entregas.
- Registro de recogidas.
- Registro y consulta de gastos logísticos.
- Consulta del resumen semanal de gastos.
- Consulta del historial de movimientos propios.
- Funcionamiento sin conexión con sincronización posterior (consulta offline, almacenamiento de operaciones pendientes, sincronización automática y manual).
- Autenticación con persistencia de sesión.

### 3.2 Fuera del alcance de la primera versión

- Creación o modificación de alquileres.
- Creación o modificación de clientes.
- Gestión de productos o inventario.
- Creación o modificación de renovaciones.
- Acceso a funcionalidades exclusivas del administrador o del encargado de facturación.
- Resumen semanal de gastos de otros usuarios (solo consulta propia).
- Historial de auditoría de alquileres.
- Emisión de facturas o documentos fiscales.
- Funcionalidades multiusuario o multiempresa.

## 4. Usuarios y actores

### Actor principal — Primera versión

**Encargado logístico (EL):** empleado de Fundiplacas Rodríguez responsable de las operaciones de campo. Realiza entregas de equipos de andamiaje a las obras, recoge los equipos al finalizar el alquiler, y registra gastos operativos relacionados con la logística. Opera principalmente desde el campo, con conectividad intermitente.

### Actores del sistema con los que interactúa indirectamente

- **API central del SGA (FastAPI):** fuente de datos y receptor de operaciones sincronizadas.
- **Sistema de mapas externo:** proveedor del mapa y del servicio de ruta GPS.

### Actores fuera del alcance de la aplicación móvil (primera versión)

- Administrador.
- Encargado de facturación.
- Clientes del sistema.

## 5. Funcionalidades principales

| Grupo | Funcionalidad |
|---|---|
| Autenticación | Inicio de sesión con usuario o teléfono y contraseña; persistencia de sesión; cierre de sesión seguro |
| Inicio | Pantalla de inicio con acceso rápido a funcionalidades principales |
| Alquileres | Listado con búsqueda y filtros; detalle completo del alquiler |
| Ubicación y ruta | Visualización del destino en mapa dentro de la app; acceso a ruta GPS |
| Entregas | Registro de entrega completa de un alquiler |
| Recogidas | Registro de recogida de un alquiler |
| Gastos | Registro de gasto logístico; consulta de gastos propios; resumen semanal |
| Historial | Consulta del historial de movimientos propios |
| Offline | Consulta sin conexión de datos descargados; almacenamiento de operaciones pendientes |
| Sincronización | Sincronización automática y manual de datos y operaciones pendientes |

## 6. Contexto operativo

- El encargado logístico trabaja en obras de construcción, con conectividad variable o nula en algunos sitios.
- Los dispositivos utilizados son de gama baja y media.
- La aplicación debe operar en condiciones de baja batería y recursos limitados.
- El entorno es principalmente de uso en exteriores, con exposición al sol, polvo y condiciones adversas para la lectura de pantallas.
- La orientación de uso es principalmente vertical.

## 7. Restricciones

1. La aplicación es un complemento del SGA existente; no reemplaza ni modifica el sistema web.
2. No se modifica el backend, la base de datos ni el frontend web del SGA.
3. La aplicación se comunica exclusivamente con la API central del SGA mediante el cliente HTTP centralizado del módulo móvil.
4. Las pantallas no ejecutan directamente solicitudes HTTP ni manipulan la base de datos local.
5. La primera versión está dirigida exclusivamente al encargado logístico.
6. La tecnología prevista es React Native con Expo (Android e iOS).
7. El módulo móvil reside en `sga_mobile/` dentro del repositorio del SGA, como carpeta independiente.
8. El uso de mapas y GPS no debe bloquear el resto de la aplicación si se deniega el permiso.

## 8. Supuestos expresamente aprobados

1. El encargado logístico tiene credenciales válidas en el sistema SGA (usuario o teléfono y contraseña).
2. La API central del SGA está disponible para autenticación y sincronización cuando haya conexión.
3. Los datos de alquileres disponibles offline son los que el dispositivo ha descargado previamente durante sesiones con conexión.
4. La entrega de un alquiler es completa; no existe entrega parcial en la primera versión.
5. Los datos de fecha, hora y usuario de las operaciones se gestionan automáticamente; el encargado logístico no los introduce manualmente.
6. El encargado logístico puede registrar una recogida para alquileres activos o vencidos, sin que se le exija un registro de autorización previa de facturación.
7. Los daños, faltantes y novedades se describen en un campo de observaciones libre; los ajustes de inventario los gestiona manualmente el administrador.
8. Los gastos son gastos logísticos generales; no tienen categorías predefinidas obligatorias ni un límite establecido.

## 9. Exclusiones explícitas

- El encargado logístico no crea ni modifica renovaciones desde la aplicación móvil.
- El encargado logístico no edita ni elimina gastos desde la aplicación móvil.
- El encargado logístico no accede al historial de auditoría completo del sistema.
- La consulta general de gastos de todos los usuarios corresponde al sistema web.
- No se implementan funcionalidades de administración, facturación, gestión de productos ni de usuarios desde la aplicación móvil.

## 10. Relación con el SGA existente

| Elemento del SGA | Relación con el módulo móvil |
|---|---|
| Backend FastAPI (`sga_backend_jwt/`) | Fuente de datos y receptor de operaciones. No se modifica. |
| Frontend web React (`sga_frontend_jwt/`) | Cliente web independiente. No se modifica. No comparte código con la app móvil. |
| Base de datos PostgreSQL | Fuente de datos indirecta a través de la API. No se modifica. |
| API REST (`/api/sga`) | La app móvil la consume como cliente. Los endpoints disponibles para el encargado logístico son los accesibles con el rol `encargado_logistico` según la matriz RBAC del SGA (ver `DXC-2026-005`). |
| Autenticación JWT | La app móvil usa el mismo endpoint `POST /api/sga/auth/login`. El token JWT se almacena de forma segura en el dispositivo. |

> [!IMPORTANT]
> El hecho de que un endpoint exista en la API del SGA no implica automáticamente que esté disponible o sea adecuado para el módulo móvil. Cada integración debe validarse contra el contrato de API y los requisitos del módulo.

> [!NOTE]
> Algunos endpoints o comportamientos necesarios para el módulo móvil pueden requerir cambios o nuevos endpoints en el backend. Dichos cambios se registran como dependencias o pendientes de validación técnica, y requieren autorización expresa antes de implementarse.

---

*Documento consolidado el 2026-11-21. Fase 1 cerrada.*
