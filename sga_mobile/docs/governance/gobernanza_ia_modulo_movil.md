# Gobernanza de IA — Módulo Logístico Móvil del SGA

> **Proyecto:** Sistema de Gestión de Alquileres (SGA) — Fundiplacas Rodríguez
> **Módulo:** Logístico Móvil (`sga_mobile/`)
> **Fecha de consolidación:** 2026-11-21
> **Fuente:** Instrucción aprobada de consolidación documental del módulo logístico móvil

---

> [!IMPORTANT]
> Este documento registra las decisiones aprobadas de gobernanza de IA para el trabajo asistido en el módulo logístico móvil del SGA. No constituye autorización para implementar Skills, modificar otros archivos del repositorio ni ejecutar ninguna tarea fuera del alcance aprobado en cada intervención.

---

## 1. Herramientas de IA y sus roles

| Herramienta | Rol aprobado | Restricción |
|---|---|---|
| **OpenCode** | Auditoría, investigación y verificación | Modo de solo lectura. No implementa ni modifica archivos. |
| **Antigravity** | Implementación y organización | Únicamente con autorización expresa por tarea. No asume que una autorización para una tarea habilita otras. |

---

## 2. Principios de gobernanza

### 2.1 Permisos y niveles de riesgo delimitados

Cada tarea asignada a una herramienta de IA debe tener:

- **Alcance explícito:** qué archivos puede leer, qué archivos puede modificar, qué acciones están prohibidas.
- **Nivel de riesgo:** bajo (documentación, lectura), medio (organización), alto (implementación, cambios en backend, commits, despliegues).
- **Autorización previa:** ninguna tarea de nivel medio o alto se ejecuta sin autorización expresa del propietario.

### 2.2 No asumir permisos transitivos

Una autorización para una tarea específica no habilita la ejecución de otras tareas, aunque estén relacionadas. Cada tarea requiere su propia autorización.

### 2.3 Separación de roles

El implementador debe ser distinto del auditor cuando corresponda. OpenCode audita; Antigravity implementa. No deben intercambiar roles sin decisión explícita.

### 2.4 Revisión independiente de implementaciones

Las implementaciones realizadas por una herramienta de IA deben ser revisadas de forma independiente antes de considerarse aprobadas.

---

## 3. Restricciones operativas

| Acción | Estado |
|---|---|
| Commits al repositorio | Solo con autorización previa aprobada |
| Push al repositorio | Solo con autorización previa aprobada |
| Merge de ramas | Requiere autorización expresa |
| Despliegue de cualquier componente | Requiere autorización expresa |
| Modificación del frontend web (`sga_frontend_jwt/`) | Prohibida sin autorización expresa |
| Modificación del backend (`sga_backend_jwt/`) | Prohibida sin autorización expresa |
| Modificación de la base de datos | Prohibida sin autorización expresa |
| Instalación de dependencias | Prohibida sin autorización expresa |
| Inicialización del proyecto Expo | Prohibida sin autorización expresa |
| Creación de componentes, pantallas o lógica de negocio ejecutable | Prohibida sin autorización expresa |

---

## 4. Flujo de aprobación

```
Especialista (OpenCode/Antigravity)
        ↓
    Propone
        ↓
Orquestador / Coordinador (Antigravity como coordinador)
        ↓
    Revisa y valida coherencia
        ↓
    Usuario / Propietario del proyecto
        ↓
    Aprueba o rechaza
        ↓
Implementación autorizada (Antigravity con permisos delimitados)
```

**Regla:** Los especialistas pueden proponer. El orquestador revisa. El usuario aprueba. Solo después de la aprobación se ejecuta.

---

## 5. Skills de IA

| Regla | Estado |
|---|---|
| Todas las Skills requieren validación básica antes de aplicarse | Aprobada |
| Las Skills de mayor riesgo (implementación, commits, despliegues) requieren pruebas reforzadas | Aprobada |
| La ruta definitiva de las Skills dentro del repositorio sigue pendiente de decisión | Pendiente de decisión del propietario |

---

## 6. Revisiones de código y seguridad

- Las revisiones de código producidas por IA tienen controles reforzados.
- No se acepta código generado por IA sin revisión independiente en cambios de nivel medio o alto.
- Las auditorías de seguridad se realizan en modo de solo lectura (OpenCode).

---

## 7. Registros y trazabilidad

- Cada intervención de IA en el repositorio debe quedar documentada con:
  - Qué archivos se leyeron.
  - Qué archivos se crearon o modificaron.
  - Qué fuentes se utilizaron.
  - Qué información quedó pendiente.
  - Confirmación de que no se realizaron acciones fuera del alcance autorizado.

---

## 8. Vigencia y actualización

Este documento refleja las decisiones de gobernanza aprobadas a la fecha de su consolidación (2026-11-21). Cualquier modificación requiere aprobación expresa del propietario del proyecto. No se modifica unilateralmente.

---

*Documento consolidado el 2026-11-21.*
