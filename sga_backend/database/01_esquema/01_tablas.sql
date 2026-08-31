-- =========================================================
-- SGA - Sistema de Gestión de Alquileres de Andamios
-- ARCHIVO: 01_tablas.sql
-- CONTENIDO: Definición de tablas (DDL) e índices.
-- ORIGEN: extraído sin modificaciones de CREAR_TABLAS.sql
--         (líneas 1-221 del archivo original), como parte de
--         la reorganización documental del proyecto.
-- ORDEN DE EJECUCIÓN: 1 de 2 (ejecutar antes de
--         02_funciones_y_triggers.sql, ya que los triggers
--         referencian estas tablas).
-- TABLAS INCLUIDAS (en orden de creación):
--   1. usuario
--   2. producto
--   3. alquiler
--   4. detalle_alquiler
--   5. logistica_alquiler
-- NOTA: el contenido SQL de este archivo es idéntico al
-- original. Solo se agregó este encabezado informativo.
-- =========================================================

-- =========================================================
-- BASE DE DATOS: sga_db
-- SISTEMA DE GESTIÓN DE ALQUILERES DE ANDAMIOS
-- MOTOR: PostgreSQL
-- =========================================================

-- =========================================================
-- TABLA: usuario
-- =========================================================

-- CORRECCIÓN (aplicada a solicitud explícita del usuario, 2026):
-- rol_usuario se amplió de VARCHAR(20) a VARCHAR(30). El valor
-- 'encargado_facturacion' (21 caracteres) no cabía en VARCHAR(20),
-- por lo que ese rol nunca se habría podido insertar con el
-- esquema original. Bug detectado al probar el backend contra una
-- base de datos PostgreSQL real. No se modificó ningún otro campo,
-- constraint, trigger ni relación.
CREATE TABLE usuario (
    id_usuario VARCHAR(20) PRIMARY KEY,
    rol_usuario VARCHAR(30) NOT NULL DEFAULT 'cliente',
    nombres_usuario VARCHAR(100) NOT NULL,
    apellidos_usuario VARCHAR(100) NOT NULL,
    email_usuario VARCHAR(100) UNIQUE DEFAULT NULL,
    telefono_usuario VARCHAR(20) NOT NULL UNIQUE,
    contrasena_usuario VARCHAR(255) DEFAULT NULL,
    tipo_documento VARCHAR(20) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado_usuario BOOLEAN DEFAULT TRUE NOT NULL,

    CONSTRAINT chk_usuario_rol
        CHECK (
            rol_usuario IN (
                'admin',
                'encargado_facturacion',
                'encargado_logistico',
                'cliente'
            )
        ),
    CONSTRAINT chk_usuario_tipo_documento
        CHECK (
            tipo_documento IN (
                'CC',
                'CE',
                'NIT',
                'PPT'
            )
        )
);


-- =========================================================
-- TABLA: producto
-- =========================================================

CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(100) NOT NULL,
    descripcion_producto VARCHAR(300) NOT NULL,
    precio_base_producto NUMERIC(10, 2) NOT NULL,
    stock_total INTEGER NOT NULL,
    stock_alquilado INTEGER NOT NULL DEFAULT 0,
    
    -- Campos de auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por VARCHAR(50),
    actualizado_por VARCHAR(50),
    estado_registro BOOLEAN DEFAULT TRUE NOT NULL,
    eliminado_por VARCHAR(50),
    fecha_eliminacion TIMESTAMP,

    -- Restricciones CHECK
    CONSTRAINT chk_producto_precio
        CHECK (precio_base_producto >= 0),
    CONSTRAINT chk_producto_stock_total
        CHECK (stock_total >= 0 AND stock_alquilado <= stock_total),
    CONSTRAINT chk_producto_stock_alquilado
        CHECK (stock_alquilado >= 0 AND stock_alquilado <= stock_total)
);

-- =========================================================
-- TABLA: alquiler
-- =========================================================

CREATE TABLE alquiler (
    id_alquiler SERIAL PRIMARY KEY,
    id_usuario_creador VARCHAR(20) NOT NULL,
    id_usuario_cliente VARCHAR(20) NOT NULL,
    estado_alquiler VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    barrio VARCHAR(100) NOT NULL,
    deposito NUMERIC(10, 2) NOT NULL, -- Obligatorio, sin valor por defecto
    precio_alquiler NUMERIC(10, 2) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    tiempo_alquiler INTEGER NOT NULL, -- en semanas
    se_lleva BOOLEAN NOT NULL DEFAULT TRUE,
    se_recoge BOOLEAN NOT NULL DEFAULT TRUE, -- Corregido al nombre original

    -- Campos de auditoría (sin duplicidades)
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado_registro BOOLEAN DEFAULT TRUE NOT NULL,
    actualizado_por VARCHAR(50),
    eliminado_por VARCHAR(50),
    fecha_eliminacion TIMESTAMP,

    -- Restricciones de Llaves Foráneas
    CONSTRAINT fk_alquiler_usuario_creador 
        FOREIGN KEY (id_usuario_creador) 
        REFERENCES usuario(id_usuario) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    CONSTRAINT fk_alquiler_usuario_cliente 
        FOREIGN KEY (id_usuario_cliente) 
        REFERENCES usuario(id_usuario) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    -- Restricciones CHECK
    CONSTRAINT chk_alquiler_precio 
        CHECK (precio_alquiler > 0),

    CONSTRAINT chk_alquiler_deposito 
        CHECK (deposito >= 0),

    CONSTRAINT chk_alquiler_tiempo 
        CHECK (tiempo_alquiler > 0),

    CONSTRAINT chk_alquiler_estado 
        CHECK (estado_alquiler IN ('pendiente', 'activo', 'vencido', 'recogido', 'terminado', 'cancelado'))
);

-- =========================================================
-- TABLA INTERMEDIA: alquiler_producto
-- RELACIÓN: detalle_alquiler
-- =========================================================

CREATE TABLE detalle_alquiler (
    id_detalle_alquiler SERIAL PRIMARY KEY,
    id_alquiler INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    precio_conjunto NUMERIC(10, 2) NOT NULL,
    cantidad_productos INTEGER NOT NULL,
    es_producto_extra BOOLEAN NOT NULL DEFAULT FALSE, -- Identifica si excede lo estándar y genera cobro
    
    -- Campos de auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_por VARCHAR(50),
    estado_registro BOOLEAN DEFAULT TRUE NOT NULL,
    actualizado_por VARCHAR(50),
    eliminado_por VARCHAR(50),
    fecha_eliminacion TIMESTAMP,

    -- Restricciones de Llaves Foráneas
    CONSTRAINT fk_detalle_alquiler_alquiler 
        FOREIGN KEY (id_alquiler) 
        REFERENCES alquiler(id_alquiler) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    CONSTRAINT fk_detalle_alquiler_producto 
        FOREIGN KEY (id_producto) 
        REFERENCES producto(id_producto) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    -- Restricciones CHECK
    CONSTRAINT chk_detalle_cantidad 
        CHECK (cantidad_productos > 0),

    CONSTRAINT chk_detalle_precio_conjunto 
        CHECK (precio_conjunto >= 0)

    
);

-- =========================================================
-- TABLA: logistica_alquiler
-- =========================================================

CREATE TABLE logistica_alquiler (
    id_logistica_alquiler SERIAL PRIMARY KEY,
    id_usuario_logistico VARCHAR(20) NOT NULL,
    id_alquiler INTEGER NOT NULL,
    fecha_gasto TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    descripcion_gasto_logistico TEXT,
    valor_gasto_logistico NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    observaciones_logistica_alquiler TEXT,
    es_recogida BOOLEAN NOT NULL, -- TRUE si es recogida, FALSE si es entrega
    
    -- Campos de auditoría
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado_registro BOOLEAN DEFAULT TRUE NOT NULL,
    actualizado_por VARCHAR(50),
    eliminado_por VARCHAR(50),
    fecha_eliminacion TIMESTAMP,

    -- Restricciones de Llaves Foráneas
    CONSTRAINT fk_logistica_usuario 
        FOREIGN KEY (id_usuario_logistico) 
        REFERENCES usuario(id_usuario) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,
        
    CONSTRAINT fk_logistica_alquiler 
        FOREIGN KEY (id_alquiler) 
        REFERENCES alquiler(id_alquiler) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    -- Restricciones CHECK
    CONSTRAINT chk_logistica_valor_gasto 
        CHECK (valor_gasto_logistico >= 0)
);

-- =========================================================
-- ÍNDICES
-- =========================================================
-- un indice es una estructura de datos que mejora la velocidad de las operaciones de consulta en una tabla a costa de espacio adicional y tiempo de mantenimiento durante las operaciones de escritura (INSERT, UPDATE, DELETE).


-- Índice único condicional (Restricción inteligente de duplicados)
CREATE UNIQUE INDEX idx_unico_producto_alquiler 
ON detalle_alquiler (id_alquiler, id_producto) 
WHERE es_producto_extra = FALSE;
