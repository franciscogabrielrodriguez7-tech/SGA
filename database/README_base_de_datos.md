# SGA — Sistema de Gestión de Alquileres de Andamios (`database`)

Base de datos PostgreSQL para el sistema de gestión de alquileres de andamios (SGA). Este documento describe la estructura actual del directorio de base de datos, el contenido de los scripts, el orden lógico de ejecución y el diccionario completo del esquema.

## Estructura del proyecto

```text
database/
├── 01_esquema/
│   ├── 01_tablas.sql                <- CREATE TABLE + índices
│   ├── 02_funciones_y_triggers.sql  <- Funciones PL/pgSQL + triggers de negocio
│   ├── 03_seed_data.sql             <- Datos semilla iniciales
│   ├── 04_plantillas.sql            <- Plantillas DML modulares para operaciones
│   └── 05_consultas.sql             <- Consultas DQL analíticas y reportes
├── 03_documentacion/
│   └── INDICE.md                    <- Diccionario rápido de tablas y archivos
└── README_base_de_datos.md          <- Este archivo