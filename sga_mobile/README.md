# sga_mobile — Módulo Logístico Móvil del SGA

> **Proyecto:** Sistema de Gestión de Alquileres (SGA) — Fundiplacas Rodríguez  
> **Rama oficial de desarrollo:** `mobile/mvp`  
> **Fecha de actualización:** 2026-11-21  
> **Estado del módulo:** MVP funcional completado con **datos simulados** (Entregas 1, 2 y 3 implementadas; 39/39 pruebas automatizadas aprobadas). Ver [docs/seguimiento_mvp.md](docs/seguimiento_mvp.md) y [docs/implementation/entrega_03.md](docs/implementation/entrega_03.md).  
> **Aviso:** los documentos de requisitos de `docs/requirements/` contienen contradicciones abiertas frente a la Matriz de Trazabilidad (Borrador 1.0) registradas en [docs/seguimiento_mvp.md](docs/seguimiento_mvp.md). El MVP no integra aún la API real del SGA (Fase 6).

---

## 1. Propósito de esta carpeta

`sga_mobile/` es la carpeta raíz e independiente del módulo logístico móvil del SGA. Contiene la documentación técnica y la aplicación móvil en React Native con Expo diseñada para el **encargado logístico (EL)** de Fundiplacas Rodríguez.

Esta carpeta es independiente del frontend web (`sga_frontend_jwt/`), del backend (`sga_backend_jwt/`) y de la base de datos (`database/`), los cuales **no han sido modificados**.

---

## 2. Instrucciones de ejecución y verificación

Desde la carpeta `sga_mobile/`:

```powershell
# 1. Instalar dependencias (si aún no están instaladas)
npm.cmd install

# 2. Verificar tipado estricto TypeScript
npm.cmd run typecheck
# o directamente:
npx.cmd tsc --noEmit

# 3. Ejecutar las 39 pruebas unitarias e integrales (6 suites)
node --test "tests/alquileres.test.ts" "tests/auth.test.ts" "tests/cola.test.ts" "tests/gastos.test.ts" "tests/historial.test.ts" "tests/flujo_mvp_e2e.test.ts"

# 4. Iniciar servidor de desarrollo Expo (para Expo Go en dispositivo físico o emulador Android/iOS)
npm.cmd start
```

### Credenciales simuladas de prueba
- **Encargado logístico activo (por usuario):** `logistico1` / `demo123`
- **Encargado logístico activo (por teléfono):** `3001234567` / `demo123`
- **Usuario deshabilitado (para probar bloqueo):** `logistico_bloqueado` / `demo456`

---

## 3. Arquitectura implementada en el MVP

```text
sga_mobile/
├── App.tsx                         ← Punto de entrada con SafeAreaProvider y AuthProvider
├── app.json                        ← Configuración Expo (orientación vertical, claro/oscuro)
├── package.json                    ← Expo SDK 58, React Native 0.88, TypeScript 6, NetInfo, AsyncStorage
├── tsconfig.json                   ← Configuración TypeScript estricta
├── src/
│   ├── types/
│   │   ├── models.ts               ← Alquiler, DetalleAlquiler, ClienteResumen, Resultado<T>
│   │   ├── auth.ts                 ← SesionUsuario, PerfilUsuarioNoSensible, ElementosAutenticacion, ResultadoSolicitudCierre
│   │   ├── gastos.ts               ← GastoLogistico, AsociacionGasto ('entrega'|'recogida'), ResumenSemanalGastos
│   │   ├── historial.ts            ← RegistroHistorial, FiltrosHistorial, ReferenciaAlquilerHistorial
│   │   └── queue.ts                ← OperacionPendiente<T>, PayloadEntrega, PayloadRecogida, PayloadGasto
│   ├── domain/
│   │   ├── fechas.ts               ← Utilidades puras de fechas ISO
│   │   ├── alquileres.ts           ← Reglas de visibilidad, elegibilidad entrega/recogida, búsqueda, filtros y orden
│   │   ├── gastos.ts               ← Validación RNM-09/10/11, filtros y cálculo de resumen semanal lunes a domingo
│   │   └── historial.ts            ← Unificación RNM-13/14, orden descendente, filtros y sugerencias de búsqueda
│   ├── data/mock/
│   │   ├── alquileres.ts           ← 13 alquileres simulados (101–113, incluyendo 2 cancelados ocultos)
│   │   ├── auth.ts                 ← Credenciales y verificación simulada
│   │   ├── escenario.ts            ← Selector de escenarios ('normal' | 'vacio' | 'error')
│   │   ├── gastos.ts               ← Gastos iniciales simulados (semana actual, semana anterior, múltiples asociaciones)
│   │   └── historial.ts            ← Operaciones iniciales de entregas y recogidas
│   ├── storage/
│   │   ├── kvAdapter.ts            ← Puente multiplataforma AsyncStorage / memoria (compatible con Node.js test)
│   │   ├── sesion.ts               ← Persistencia de sesión, separación en 4 categorías y SecureStorageAdapter (DEP-INT-02)
│   │   └── cola.ts                 ← Cola local persistente aislada por id_usuario, anti-duplicados y cancelación expresa
│   ├── services/
│   │   ├── index.ts                ← Único punto de sustitución de adaptadores mock por API real (Fase 6)
│   │   ├── AlquileresService.ts
│   │   ├── AuthService.ts
│   │   ├── GastosService.ts
│   │   ├── HistorialService.ts
│   │   ├── MapService.ts
│   │   └── mock/
│   │       ├── estadoSimulado.ts   ← Almacén reactivo compartido del servidor simulado (transiciones RNM-16)
│   │       ├── alquileresServiceMock.ts
│   │       ├── authServiceMock.ts
│   │       ├── gastosServiceMock.ts
│   │       ├── historialServiceMock.ts
│   │       ├── mapServiceMock.ts
│   │       └── syncServiceMock.ts  ← Hasta 3 intentos automáticos (RNM-17) y validación de estados (RNM-16)
│   ├── context/
│   │   ├── AuthContext.tsx         ← Gestión de sesión, persistencia, bloqueo biométrico y cierre seguro (§3.1/§3.2)
│   │   └── ConectividadContext.tsx ← Integración con NetInfo real, auto-sync al reconectar y monitoreo de cola (§3.6)
│   ├── hooks/
│   │   ├── useAsync.ts
│   │   ├── useConectividad.ts      ← Máquina de 5 estados de conectividad con NetInfo
│   │   └── useEscenarioMock.ts
│   ├── components/
│   │   ├── ui.tsx                  ← Componentes base (Tarjeta, Boton, Etiqueta, BannerOrigen, etc.)
│   │   ├── AlquilerCard.tsx
│   │   └── BannerEstadoSistema.tsx ← Barra global de conectividad, cola pendiente y modal de cierre de sesión seguro
│   ├── navigation/
│   │   ├── types.ts
│   │   └── RootNavigator.tsx       ← 4 pestañas (Inicio, Alquileres, Gastos, Historial) + stack de operaciones
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── InicioScreen.tsx
│       ├── ListaAlquileresScreen.tsx
│       ├── DetalleAlquilerScreen.tsx
│       ├── EntregaScreen.tsx
│       ├── RecogidaScreen.tsx
│       ├── MapaScreen.tsx
│       ├── GastosScreen.tsx
│       ├── HistorialScreen.tsx
│       └── SeccionBase.tsx
├── tests/
│   ├── alquileres.test.ts          ← 9 pruebas
│   ├── auth.test.ts                ← 12 pruebas
│   ├── cola.test.ts                ← 4 pruebas
│   ├── gastos.test.ts              ← 8 pruebas
│   ├── historial.test.ts           ← 5 pruebas
│   └── flujo_mvp_e2e.test.ts       ← 1 prueba integral de los 16 criterios del MVP
└── docs/
    ├── 00_indice.md
    ├── seguimiento_mvp.md          ← Seguimiento central del MVP y comparación documental
    ├── analysis/
    ├── requirements/
    ├── architecture/
    ├── governance/
    └── implementation/
        ├── entrega_01.md
        ├── entrega_02.md
        └── entrega_03.md
```
