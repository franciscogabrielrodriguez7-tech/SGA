# Índice Documental — Módulo Logístico Móvil SGA

> **Proyecto:** Sistema de Gestión de Alquileres (SGA) — Fundiplacas Rodríguez
> **Módulo:** Logístico Móvil (`sga_mobile/`)
> **Fecha de creación:** 2026-11-21
> **Fases cubiertas:** 1, 2, 3 y 4 (cerradas)

---

## Inventario de documentos

| # | Documento | Ruta | Descripción | Estado |
|---|---|---|---|---|
| 1 | `analisis_diseno_modulo_logistico_movil.md` | `docs/analysis/` | Análisis y diseño del módulo: propósito, problema, alcance, actores, funcionalidades, contexto, restricciones, supuestos y exclusiones | Consolidado (fuente: instrucción aprobada de Fase 1) |
| 2 | `historias_usuario.md` | `docs/requirements/` | 18 historias de usuario aprobadas (HU-01 a HU-18) con criterios de aceptación completos | Consolidado (fuente: instrucción aprobada de Fase 2) |
| 3 | `reglas_negocio.md` | `docs/requirements/` | Reglas de negocio aprobadas para el módulo móvil | Consolidado (fuente: instrucción aprobada de Fase 2) |
| 4 | `requisitos_no_funcionales.md` | `docs/requirements/` | Requisitos no funcionales aprobados | Consolidado (fuente: instrucción aprobada de Fase 2) |
| 5 | `matriz_trazabilidad.md` | `docs/requirements/` | Matriz de trazabilidad de 50 RF | ⚠️ Pendiente — no disponible en fuentes accesibles del repositorio (ver nota) |
| 6 | `arquitectura_modulo_logistico_movil.md` | `docs/architecture/` | Arquitectura aprobada: capas, decisiones ADR-001 a ADR-016, elementos AD-01 a AD-13, dependencias de backend | Consolidado (fuente: instrucción aprobada de Fase 3) |
| 7 | `flujos_navegacion_modulo_logistico_movil.md` | `docs/architecture/` | Flujos de navegación aprobados: estructura, pantallas, estados, sincronización offline, errores | Consolidado (fuente: instrucción aprobada de Fase 4) |
| 8 | `gobernanza_ia_modulo_movil.md` | `docs/governance/` | Gobernanza de IA: roles de herramientas, permisos, niveles de riesgo, flujo de aprobación | Consolidado (fuente: instrucción aprobada) |
| 9 | `seguimiento_mvp.md` | `docs/` | Documento central de seguimiento del MVP: decisiones Git (`mobile/mvp`), reconocimiento del repositorio, entregas 1–3, pruebas, dependencias de integración y comparación documental de trazabilidad (`RNM` vs `RN-MOV`, `RNF`) | En actualización continua durante el MVP |
| 10 | `entrega_01.md` | `docs/implementation/` | Informe detallado de la Entrega 1 (estructura, navegación, Inicio y Alquileres con mock data) | Completado |
| 11 | `entrega_02.md` | `docs/implementation/` | Informe detallado de la Entrega 2 (autenticación simulada, cola offline, Entrega, Recogida y Mapa simulado) | Completado |
| 12 | `entrega_03.md` | `docs/implementation/` | Informe detallado de la Entrega 3 y cierre funcional del MVP (cierre de sesión seguro, persistencia de sesión, gastos, resumen semanal, historial, conectividad NetInfo y análisis `npm audit`) | Completado |

---

## Notas sobre faltantes

### matriz_trazabilidad.md — Pendiente de validación

**Estado:** El documento de la matriz de trazabilidad de 50 requisitos funcionales (RF) no ha podido ser recuperado de las fuentes accesibles en el repositorio. No existe ningún archivo en el repositorio que contenga la matriz con sus identificadores RF originales.

**Acción requerida:** El propietario debe proporcionar el documento fuente de la matriz de trazabilidad (con identificadores RF-001 a RF-050, o equivalentes, sus descripciones, relación con historias de usuario y estado de validación) para que pueda consolidarse sin reconstrucción por inferencia.

**Lo que NO se hará:** No se reconstruirá la matriz a partir de los títulos de las historias de usuario ni se inventarán identificadores RF. Se registra como pendiente hasta recibir la fuente.

### ADR y elementos de arquitectura AD — Pendiente de contenido completo

Los identificadores ADR-001 a ADR-016 y AD-01 a AD-13 están referenciados en la instrucción aprobada. El contenido completo de cada ADR y elemento arquitectónico no ha sido proporcionado como fuente independiente. El documento de arquitectura consolida lo que fue descrito en la instrucción; los identificadores se conservan con la indicación de que su contenido detallado está pendiente de la fuente original.

---

## Estado de hoja de ruta

| Fase | Nombre | Estado |
|---|---|---|
| 1 | Ficha de análisis de funcionalidad móvil | ✅ Cerrada |
| 2 | Historias de usuario, RN, RNF y trazabilidad | ✅ Cerrada (parcialmente: matriz RF pendiente) |
| 3 | Arquitectura móvil | ✅ Cerrada |
| 4 | Flujos de navegación | ✅ Cerrada |
| 5 | Mockups y componentes | ⏳ Pendiente — próxima fase |
| 6 | Integración con API | ⏳ Pendiente |
| 7 | Backlog técnico | ⏳ Pendiente |
| 8 | Validación del diseño | ⏳ Pendiente |

---

*Fin del índice. Actualizado el 2026-11-21.*
