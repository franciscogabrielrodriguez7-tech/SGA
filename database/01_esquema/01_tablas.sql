-- =========================================================
-- SGA - Sistema de Gestión de Alquileres de Andamios
-- ARCHIVO: 01_tablas.sql
-- CONTENIDO: Definición de tablas (DDL) e índices optimizados.
-- CAMBIOS APLICADOS EN AUDITORÍA:
--   - Centralización de auditoría: Se removieron creado_por, 
--     actualizado_por, eliminado_por y fecha_eliminacion para
--     delegarlos a un esquema/tabla de auditoría dedicado.
--   - PK Natural en usuario (Documento de Identidad).
--   - Tiempo de alquiler unificado a días (tiempo_alquiler_dias)
--     para permitir flexibilidad y escalabilidad.
--   - Regla de productos base vs extras mediante la bandera 
--     es_producto_extra e índice parcial único.
-- MOTOR: PostgreSQL
-- =========================================================

-- =========================================================
-- TABLA: usuario
-- =========================================================

CREATE TABLE usuario (
    -- [CAMBIO]: id_usuario usa el número de documento directo como PK natural (CC, NIT, CE, PPT)
    id_usuario VARCHAR(20) PRIMARY KEY, 
    rol_usuario VARCHAR(30) NOT NULL DEFAULT 'cliente',
    nombres_usuario VARCHAR(100) NOT NULL,
    apellidos_usuario VARCHAR(100) NOT NULL,
    
    -- [CLAVE]: Permiten NULL para permitir clientes registrados en punto de venta sin credenciales activas
    email_usuario VARCHAR(100) UNIQUE DEFAULT NULL,
    telefono_usuario VARCHAR(20) NOT NULL UNIQUE,
    contrasena_usuario VARCHAR(255) DEFAULT NULL,
    tipo_documento VARCHAR(20) NOT NULL,
    
    -- [AUDITORÍA LIVIANA]: Control operativo mínimo y borrado lógico
    estado_registro BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Restricciones de integridad de dominio
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
    descripcion_producto VARCHAR(300), -- Opcional para facilitar registros rápidos de piezas
    precio_base_producto NUMERIC(10, 2) NOT NULL,
    stock_total INTEGER NOT NULL,
    stock_alquilado INTEGER NOT NULL DEFAULT 0,

    -- [ESCALABILIDAD DE UNIDADES]: unidad mínima con la que puede
    -- alquilarse este producto. precio_base_producto se interpreta
    -- SIEMPRE "por unidad_minima_alquiler" (ej. si es 'SEMANA', el
    -- precio es semanal, no diario). Jerarquía DIA < SEMANA < MES: un
    -- producto puede alquilarse en su unidad mínima o una superior,
    -- nunca inferior (ver app/utils/unidades.py en el backend).
    unidad_minima_alquiler VARCHAR(10) NOT NULL DEFAULT 'DIA',

    -- [AUDITORÍA LIVIANA]: Se removieron campos de autoría directa para auditoría centralizada
    estado_registro BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Restricciones de inventario físico
    CONSTRAINT chk_producto_precio
        CHECK (precio_base_producto >= 0),
    CONSTRAINT chk_producto_stock_total
        CHECK (stock_total >= 0),
    CONSTRAINT chk_producto_stock_alquilado
        CHECK (stock_alquilado >= 0 AND stock_alquilado <= stock_total),
    CONSTRAINT chk_producto_unidad_minima_alquiler
        CHECK (unidad_minima_alquiler IN ('DIA', 'SEMANA', 'MES'))
);


-- =========================================================
-- TABLA: alquiler
-- =========================================================

CREATE TABLE alquiler (
    id_alquiler SERIAL PRIMARY KEY,
    id_usuario_creador VARCHAR(20) NOT NULL, -- FK hacia usuario (Facturador/Admin)
    id_usuario_cliente VARCHAR(20) NOT NULL, -- FK hacia usuario (Cliente)
    estado_alquiler VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    barrio VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    deposito NUMERIC(10, 2) NOT NULL,
    precio_alquiler NUMERIC(10, 2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    
    -- [CAMBIO ESCALABLE]: Se definió en días para soportar alquileres por días, semanas o meses
    tiempo_alquiler_dias INTEGER NOT NULL, 
    se_lleva BOOLEAN NOT NULL DEFAULT TRUE,
    se_recoge BOOLEAN NOT NULL DEFAULT TRUE,

    -- [AUDITORÍA LIVIANA]: Control básico
    estado_registro BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Claves Foráneas con la tabla usuario
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
        CHECK (precio_alquiler >= 0),

    CONSTRAINT chk_alquiler_deposito 
        CHECK (deposito >= 0),

    CONSTRAINT chk_alquiler_tiempo_dias 
        CHECK (tiempo_alquiler_dias > 0),

    CONSTRAINT chk_alquiler_estado 
        CHECK (estado_alquiler IN ('pendiente', 'activo', 'vencido', 'recogido', 'terminado', 'cancelado'))
);


-- =========================================================
-- TABLA INTERMEDIA / DETALLE: detalle_alquiler
-- =========================================================

CREATE TABLE detalle_alquiler (
    id_detalle_alquiler SERIAL PRIMARY KEY,
    id_alquiler INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    
    -- [CLAVE]: Mantiene la "fotografía" del precio acordado al momento de firmar el contrato
    precio_conjunto NUMERIC(10, 2) NOT NULL, 
    cantidad_productos INTEGER NOT NULL,
    
    -- [REGLA DE NEGOCIO]: FALSE = Componente base del conjunto ($0.00), TRUE = Adicional cobrado
    es_producto_extra BOOLEAN NOT NULL DEFAULT FALSE, 
    
    -- Control operativo básico
    estado_registro BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

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
-- -----------------------------------------------------------
-- [UNIFICACIÓN GASTOS/LOGÍSTICA]: un registro puede ser una ENTREGA,
-- una RECOGIDA (ambas: eventos de UN solo alquiler, porque disparan
-- una transición de estado en alquiler.estado_alquiler) o un GASTO
-- puro (ej. combustible de un viaje que sirvió a varios alquileres a
-- la vez, sin transición de estado asociada). La asociación con
-- alquiler(es) vive en la tabla puente logistica_alquiler_alquiler:
-- 1 fila para ENTREGA/RECOGIDA, 1 o más para GASTO.
-- =========================================================

CREATE TABLE logistica_alquiler (
    id_logistica_alquiler SERIAL PRIMARY KEY,
    id_usuario_logistico VARCHAR(20) NOT NULL, -- FK hacia usuario que realiza el movimiento
    tipo_movimiento VARCHAR(10) NOT NULL, -- 'ENTREGA' | 'RECOGIDA' | 'GASTO'
    fecha_gasto TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    descripcion_gasto_logistico TEXT,
    valor_gasto_logistico NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    observaciones_logistica_alquiler TEXT,

    -- [AUDITORÍA LIVIANA]: Se agregó fecha_creacion para estandarizar
    estado_registro BOOLEAN DEFAULT TRUE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Restricciones de Llaves Foráneas
    CONSTRAINT fk_logistica_usuario 
        FOREIGN KEY (id_usuario_logistico) 
        REFERENCES usuario(id_usuario) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    -- Restricciones CHECK
    CONSTRAINT chk_logistica_valor_gasto 
        CHECK (valor_gasto_logistico >= 0),
    CONSTRAINT chk_logistica_tipo_movimiento
        CHECK (tipo_movimiento IN ('ENTREGA', 'RECOGIDA', 'GASTO'))
);

-- =========================================================
-- TABLA PUENTE: logistica_alquiler_alquiler
-- -----------------------------------------------------------
-- ENTREGA/RECOGIDA: exactamente 1 fila (lo garantiza la app, ya que
-- ahí sí hay una transición de estado atada a un único alquiler).
-- GASTO: 1 o más filas (varios alquileres comparten el mismo gasto).
-- =========================================================

CREATE TABLE logistica_alquiler_alquiler (
    id_logistica_alquiler INTEGER NOT NULL,
    id_alquiler INTEGER NOT NULL,

    PRIMARY KEY (id_logistica_alquiler, id_alquiler),

    CONSTRAINT fk_logalq_logistica
        FOREIGN KEY (id_logistica_alquiler)
        REFERENCES logistica_alquiler(id_logistica_alquiler)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_logalq_alquiler
        FOREIGN KEY (id_alquiler)
        REFERENCES alquiler(id_alquiler)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_logalq_alquiler ON logistica_alquiler_alquiler(id_alquiler);


-- =========================================================
-- TABLA: auditoria_sistema
-- =========================================================

CREATE TABLE auditoria_sistema (
    id_auditoria SERIAL PRIMARY KEY,
    nombre_tabla VARCHAR(50) NOT NULL,            -- Tabla afectada (ej: 'alquiler', 'producto')
    tipo_operacion VARCHAR(10) NOT NULL,           -- 'INSERT', 'UPDATE', 'DELETE'
    id_registro_afectado VARCHAR(50) NOT NULL,     -- PK del registro modificado (convertido a texto)
    datos_anteriores JSONB DEFAULT NULL,          -- Estado del registro antes del cambio (NULL en INSERT)
    datos_nuevos JSONB DEFAULT NULL,              -- Estado del registro después del cambio (NULL en DELETE)
    id_usuario_accion VARCHAR(20),                -- Cédula/NIT del usuario que realizó la acción (opcional/null si es sistema)
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Restricciones CHECK
    CONSTRAINT chk_auditoria_operacion
        CHECK (tipo_operacion IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- =========================================================
-- ÍNDICES DE RENDIMIENTO Y RESTRICCIONES PARCIALES
-- =========================================================

-- =========================================================
-- ÍNDICES DE AUDITORÍA
-- =========================================================

-- Acelera las búsquedas de historial de cambios por tabla e id de registro
CREATE INDEX idx_auditoria_tabla_registro 
ON auditoria_sistema (nombre_tabla, id_registro_afectado);

-- Acelera los reportes de actividad por usuario que realizó las modificaciones
CREATE INDEX idx_auditoria_usuario 
ON auditoria_sistema (id_usuario_accion) 
WHERE id_usuario_accion IS NOT NULL;

-- Agiliza el filtrado del historial por rango de fechas
CREATE INDEX idx_auditoria_fecha 
ON auditoria_sistema (fecha_accion);

-- ---------------------------------------------------------
-- TABLA: detalle_alquiler
-- ---------------------------------------------------------

-- [REGLA CLAVE DE NEGOCIO]: Garantiza una única línea para el ítem base del conjunto, 
-- pero permite múltiples registros si el cliente pide piezas extras adicionales.
CREATE UNIQUE INDEX idx_unico_producto_alquiler 
ON detalle_alquiler (id_alquiler, id_producto) 
WHERE es_producto_extra = FALSE;

-- Acelera la carga de productos al ver la vista/factura de un alquiler específico
CREATE INDEX idx_detalle_alquiler_id 
ON detalle_alquiler (id_alquiler);

-- Acelera la trazabilidad de qué alquileres contienen un producto en particular
CREATE INDEX idx_detalle_producto_id 
ON detalle_alquiler (id_producto);


-- ---------------------------------------------------------
-- TABLA: alquiler
-- ---------------------------------------------------------

-- Acelera las búsquedas del historial de alquileres por la cédula/NIT del cliente
CREATE INDEX idx_alquiler_cliente 
ON alquiler (id_usuario_cliente);

-- Agiliza la búsqueda de alquileres tramitados por un facturador específico
CREATE INDEX idx_alquiler_creador 
ON alquiler (id_usuario_creador);

-- Optimiza el filtrado del Dashboard principal por estado ('activo', 'vencido', 'pendiente')
CREATE INDEX idx_alquiler_estado 
ON alquiler (estado_alquiler) 
WHERE estado_registro IS TRUE;

-- Agiliza la búsqueda de alquileres y vencimientos por fecha de inicio
CREATE INDEX idx_alquiler_fecha_inicio 
ON alquiler (fecha_inicio);


-- ---------------------------------------------------------
-- TABLA: usuario
-- ---------------------------------------------------------

-- Acelera la consulta de usuarios filtrados por su rol ('cliente', 'encargado_logistico', etc.)
-- [FIX SGA-BACKEND-JWT-2]: la tabla usuario no tiene columna estado_usuario
-- (fue reemplazada por estado_registro en la auditoría centralizada de este
-- mismo esquema). El CREATE INDEX original fallaba con
-- "column «estado_usuario» does not exist" y bloqueaba la carga completa de
-- 01_tablas.sql. Corregido a estado_registro para que sea consistente con el
-- resto de las tablas (producto, alquiler, detalle_alquiler, logistica_alquiler).
CREATE INDEX idx_usuario_rol 
ON usuario (rol_usuario) 
WHERE estado_registro IS TRUE;

-- Optimiza la velocidad del inicio de sesión (login) mediante correo electrónico
CREATE INDEX idx_usuario_email 
ON usuario (email_usuario) 
WHERE email_usuario IS NOT NULL;


-- ---------------------------------------------------------
-- TABLA: logistica_alquiler
-- ---------------------------------------------------------

-- [NOTA]: idx_logistica_alquiler_id fue removido. En el nuevo esquema
-- logistica_alquiler ya NO tiene columna id_alquiler directa; la relación
-- con alquiler vive en la tabla puente logistica_alquiler_alquiler
-- (que ya tiene su propio índice idx_logalq_alquiler definido arriba).

-- Acelera los reportes de actividades asignadas a un empleado logístico
CREATE INDEX idx_logistica_usuario 
ON logistica_alquiler (id_usuario_logistico);


-- ---------------------------------------------------------
-- TABLA: producto
-- ---------------------------------------------------------

-- Acelera el autocompletado y búsqueda de productos por su nombre
CREATE INDEX idx_producto_nombre 
ON producto (nombre_producto) 
WHERE estado_registro IS TRUE;