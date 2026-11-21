# Requisitos No Funcionales — Módulo Logístico Móvil del SGA

> **Proyecto:** Sistema de Gestión de Alquileres (SGA) — Fundiplacas Rodríguez
> **Fase:** 2 — Historias de usuario, reglas de negocio, RNF y trazabilidad (cerrada)
> **Fecha de consolidación:** 2026-11-21
> **Fuente:** Instrucción aprobada de consolidación documental del módulo logístico móvil

---

> [!IMPORTANT]
> Los requisitos no funcionales registrados en este documento son los aprobados. No se añaden valores cuantitativos (tiempos de respuesta exactos, porcentajes de disponibilidad, algoritmos de cifrado concretos, etc.) que no hayan sido aprobados en las decisiones del proyecto.

---

## 1. Compatibilidad de plataforma

| ID | Requisito |
|---|---|
| RNF-01 | La aplicación debe ser compatible con Android e iOS. |
| RNF-02 | La aplicación debe funcionar correctamente en dispositivos de gama baja y media. |
| RNF-03 | La orientación de uso es principalmente vertical. |

## 2. Conectividad y operación offline

| ID | Requisito |
|---|---|
| RNF-04 | La aplicación debe funcionar durante períodos prolongados sin conexión a internet. |
| RNF-05 | Las operaciones pendientes registradas sin conexión deben persistir aunque se cierre y vuelva a abrir la aplicación. |
| RNF-06 | La sincronización debe ser automática al recuperar la conexión y también posible de forma manual. |
| RNF-07 | Las operaciones de sincronización fallidas deben permitir reintento manual. |

## 3. Rendimiento y recursos

| ID | Requisito |
|---|---|
| RNF-08 | Las consultas y acciones rutinarias deben ser rápidas desde la perspectiva del usuario de campo. |
| RNF-09 | La aplicación debe tener bajo consumo de recursos del dispositivo (memoria, CPU, batería). |
| RNF-10 | La aplicación debe minimizar las descargas innecesarias de datos. |

## 4. Seguridad y privacidad

| ID | Requisito |
|---|---|
| RNF-11 | La autenticación debe ser segura. Las credenciales y el token JWT deben almacenarse de forma segura en el dispositivo (almacenamiento seguro del sistema operativo). |
| RNF-12 | La información local almacenada en el dispositivo debe estar protegida. |
| RNF-13 | El cierre de sesión debe eliminar del dispositivo las credenciales e información privada de la sesión. |

## 5. Sesión y persistencia

| ID | Requisito |
|---|---|
| RNF-14 | La sesión debe persistir en el dispositivo mientras el token JWT sea válido. No debe exigirse volver a iniciar sesión en cada uso. |

## 6. Mapas y GPS

| ID | Requisito |
|---|---|
| RNF-15 | El uso de mapas y GPS no debe bloquear el resto de la aplicación si el usuario deniega el permiso de ubicación. |

## 7. Interfaz de usuario

| ID | Requisito |
|---|---|
| RNF-16 | La interfaz debe ser sencilla y legible en pantallas pequeñas. |
| RNF-17 | La experiencia debe ser adecuada para el contexto de trabajo de campo (exteriores, pantallas pequeñas, uso con una mano). |
| RNF-18 | La aplicación debe contemplar modo claro y modo oscuro. |

---

## Notas de alcance

Los siguientes aspectos están fuera del alcance de los requisitos no funcionales aprobados hasta el momento. Si se requieren en fases posteriores, deben proponerse, discutirse y aprobarse formalmente:

- Valores cuantitativos de tiempo de respuesta (p. ej. "menos de 2 segundos").
- Niveles de disponibilidad del servicio (p. ej. "99,9% uptime").
- Algoritmos o estándares de cifrado específicos (p. ej. AES-256).
- Requisitos de accesibilidad (WCAG, etc.) — no definidos aún.
- Requisitos de internacionalización o localización — no definidos aún.

---

*Documento consolidado el 2026-11-21. Fase 2 cerrada.*
