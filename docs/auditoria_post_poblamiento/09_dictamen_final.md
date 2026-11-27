# 09 — Dictamen final de auditoría independiente

> **Fecha:** 2026-11-26  
> **Base auditada:** `sga_db` local, `localhost`/`127.0.0.1:5432`, esquema `public`  
> **Repositorio:** `SGA_repo/SGA` @ `feat/taller-6-calidad-sqa` / `cd4a48590334675569409f197f446679065974ab`  
> **Modo:** solo lectura; sin transferencia a producción

---

## 1. Fundamento

La auditoría comprobó personalmente:

- identidad inequívoca de `sga_db` local y sesión `READ ONLY`;
- estructura idéntica a la auditoría inicial (8 tablas, 1 vista, 5 secuencias, 12 funciones, 19 triggers activos, 26 índices, 92 restricciones, revisión `d4f74f3d4896`);
- conteos de datos exactamente iguales a los declarados (14, 10, 8, 20, 14, 14, 97, 1);
- roles acordes con el backend, clientes sin contraseña y cuentas internas con formato bcrypt;
- 7 foreign keys sin huérfanos, stock conciliado en 10/10 productos, alquileres/detalles y logística coherentes, estados válidos, sin duplicados;
- 97 eventos de auditoría con actores válidos, 0 nulos y 0 inexistentes;
- dos respaldos con tamaño, SHA-256 y TOC legibles verificados personalmente;
- repositorio sin modificaciones de código, migraciones ni configuración y sin archivos `.dump`.

También se confirmaron pendientes relevantes: H-DB-01, H-DB-02, H-DB-03, H-DB-07 y H-DB-08; la documentación de implementación incompleta; tres secuencias con valores por delante del máximo; y un literal de contraseña demo en documentación generada. Ninguno de estos puntos produce una inconsistencia de datos en el estado actual, pero sí exige decisiones y correcciones antes de ejecutar cualquier replicación.

La restauración de prueba, las pruebas funcionales `31/31` y `7/7`, y la ejecución real de los scripts de limpieza/poblamiento permanecen como resultados **declarados por Antigravity**, no reproducidos por esta auditoría.

---

## 2. Dictamen

**A. APROBADO PARA PREPARAR LA SIGUIENTE ETAPA**

---

## 3. Condiciones obligatorias antes de ejecutar cualquier replicación

1. Completar los documentos ausentes de `docs/implementacion_datos_demo/`.
2. Resolver H-DB-01 y H-DB-02 para garantizar una reconstrucción reproducible.
3. Unificar la variable de sesión de H-DB-03 y verificar la protección de administradores.
4. Enmascarar `contrasena_usuario` en `fn_auditar_cambios()` y decidir el saneamiento de los 14 registros existentes sin alterarlos sin autorización.
5. Alinear la versión de PostgreSQL del entorno con `docker-compose.yml`.
6. Obtener autorización independiente para el procedimiento de transferencia.

---

## 4. Declaración final

Este dictamen **no autoriza ni ejecuta** la transferencia a producción. El trabajo de la auditoría termina con este informe y sus documentos de soporte. No se realizaron correcciones ni operaciones de escritura sobre la base ni sobre el repositorio versionado, salvo la creación expresamente autorizada de los nueve documentos en `docs/auditoria_post_poblamiento/`.
