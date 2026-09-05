-- =========================================================
-- ÍNDICE DE PLANTILLAS OPERATIVAS (FLUJO TRANSACCIONAL SGA)
-- =========================================================
-- 1. CREACIÓN DE CONTRATO:      crear_alquiler.sql
-- 2. ASIGNACIÓN DE PRODUCTOS:   detalle_alquiler.sql
-- 3. DESPACHO LOGÍSTICO:        logistica_alquiler.sql (Despacho / Estado 'activo')
-- 4. RECOGIDA Y CIERRE:         logistica_alquiler.sql (Recogida / Estado 'recogido')
-- 5. AJUSTE DE INVENTARIO:      ajuste_inventario_dano.sql
-- 6. REAPERTURA DE ALQUILER:    reabrir_alquiler.sql
-- 7. MODIFICACIÓN DE USUARIOS:  actualizar_usuario.sql
-- 8. DESACTIVACIÓN DE USUARIOS: desactivar_usuario.sql
-- =========================================================


-- =========================================================
-- 1. PLANTILLA: Crear Nuevo Contrato de Alquiler
-- Inicializa un contrato en estado 'pendiente' asociado al cliente y usuario creador.
-- =========================================================

INSERT INTO alquiler (
    id_usuario_creador,     -- [CAMBIAR]: Documento del empleado que factura (ej: '1010203040')
    id_usuario_cliente,     -- [CAMBIAR]: Documento del cliente asociado al contrato
    estado_alquiler,        -- [CAMBIAR]: 'pendiente', 'activo', etc. (Si se omite, usa 'pendiente' por defecto)
    barrio,                 -- [CAMBIAR]: Barrio de entrega del andamio (ej: 'Usme Centro')
    direccion,              -- [CAMBIAR]: Dirección exacta de la obra (ej: 'Calle 73 Sur # 14-25')
    deposito,               -- [CAMBIAR]: Valor monetario del depósito en garantía (ej: 150000.00)
    precio_alquiler,        -- [CAMBIAR]: Costo total acordado por el alquiler (ej: 450000.00)
    fecha_inicio,           -- [CAMBIAR]: Fecha de inicio del contrato (ej: CURRENT_DATE o '2026-09-06')
    tiempo_alquiler_dias,   -- [CAMBIAR]: Duración estimada en días (ej: 15)
    se_lleva,               -- [CAMBIAR]: TRUE si la empresa transporta, FALSE si el cliente lo retira
    se_recoge,              -- [CAMBIAR]: TRUE si la empresa recoge en obra, FALSE si el cliente lo devuelve
    estado_registro         -- [OPCIONAL]: TRUE por defecto para mantener el registro activo
) VALUES (
    '1010203040',
    '80123456',
    'pendiente',
    'Usme Centro',
    'Calle 73 Sur # 14-25',
    150000.00,
    450000.00,
    CURRENT_DATE,
    15,
    TRUE,
    TRUE,
    TRUE
);


-- =========================================================
-- 2. PLANTILLA: Agregar Producto a un Contrato de Alquiler
-- Dispara automáticamente el trigger de control de stock y validación de disponibilidad.
-- =========================================================

INSERT INTO detalle_alquiler (
    id_alquiler,            -- [CAMBIAR]: ID del contrato de alquiler al que pertenece
    id_producto,            -- [CAMBIAR]: ID del producto (ej: 1 = Sección de andamio ancha)
    cantidad_productos,     -- [CAMBIAR]: Cantidad de unidades a alquilar
    precio_conjunto,        -- [CAMBIAR]: Precio total calculado para esta línea
    estado_registro         -- [OPCIONAL]: TRUE por defecto
) VALUES (
    1,                      -- ID del alquiler
    1,                      -- ID del producto
    10,                     -- Cantidad
    25000.00,               -- Precio conjunto
    TRUE
);


-- =========================================================
-- 3. PLANTILLA: Registrar Despacho Logístico (Entrega en Obra)
-- Registra la salida inicial y actualiza el estado del contrato a 'activo'.
-- =========================================================

INSERT INTO logistica_alquiler (
    id_usuario_logistico,               -- [CAMBIAR]: Documento del empleado logístico asignado (ej: '1020304050')
    id_alquiler,                        -- [CAMBIAR]: ID del contrato de alquiler asociado (ej: 1)
    descripcion_gasto_logistico,        -- [CAMBIAR]: Concepto del gasto asociado al transporte (ej: 'Flete y combustible')
    valor_gasto_logistico,              -- [CAMBIAR]: Costo del flete/gasto operativo (ej: 45000.00 o 0.00)
    observaciones_logistica_alquiler,   -- [CAMBIAR]: Notas sobre la operación en campo
    es_recogida,                        -- [CAMBIAR]: FALSE = Despacho/Entrega inicial en obra
    estado_registro                     -- [OPCIONAL]: TRUE por defecto
) VALUES (
    '1020304050',
    4,
    'Transporte de ida a obra',
    45000.00,
    'Entrega realizada sin novedad.',
    FALSE,                              -- FALSE para despacho/entrega inicial
    TRUE
);

-- Transición de estado tras el despacho:
UPDATE alquiler 
SET estado_alquiler = 'activo',
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE id_alquiler = 1;


-- =========================================================
-- 4. PLANTILLA: Registrar Logística de Recogida y Cierre
-- Retira los equipos de la obra y devuelve automáticamente el stock a bodega.
-- =========================================================

INSERT INTO logistica_alquiler (
    id_usuario_logistico,               -- [CAMBIAR]: Documento del empleado logístico encargado
    id_alquiler,                        -- [CAMBIAR]: ID del contrato de alquiler
    descripcion_gasto_logistico,        -- [CAMBIAR]: Concepto del gasto de transporte de retorno
    valor_gasto_logistico,              -- [CAMBIAR]: Costo del flete de recogida
    observaciones_logistica_alquiler,   -- [CAMBIAR]: Estado en el que se reciben los equipos
    es_recogida,                        -- [FIJO]: TRUE porque corresponde a la recogida del material
    estado_registro                     -- [OPCIONAL]: TRUE por defecto
) VALUES (
    '1020304050',
    4,
    'Transporte de retorno desde obra',
    45000.00,
    'Material recogido a satisfacción.',
    TRUE,                               -- TRUE indica operación de recogida
    TRUE
);

-- Transición de estado tras la recogida:
UPDATE alquiler 
SET estado_alquiler = 'recogido',       -- o 'terminado'
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE id_alquiler = 1;


-- =========================================================
-- 5. PLANTILLA: Ajuste de Inventario por Modificación o Daño
-- Actualiza el stock total disponible en bodega (validado por triggers).
-- =========================================================

UPDATE producto
SET stock_total = 160,                      -- [CAMBIAR]: Nuevo stock total disponible en bodega
    descripcion_producto = 'Sección de andamio ancha reforzada - Lote actualizado', -- [CAMBIAR]: Descripción
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE id_producto = 1;                       -- [CAMBIAR]: ID del producto


-- =========================================================
-- 6. PLANTILLA: Reapertura Administrativa de Alquiler Cerrado
-- Ejecuta la función del sistema para reabrir un contrato validando stock.
-- =========================================================

SELECT fn_admin_reabrir_alquiler(
    1   -- [CAMBIAR]: ID del contrato de alquiler que se requiere reabrir
);


-- =========================================================
-- 7. PLANTILLA: Modificación de Datos de Usuario o Empleado
-- Permite actualizar información de contacto, rol o estado de un usuario existente.
-- =========================================================

UPDATE usuario
SET nombres_usuario = 'Carlos Andrés',          -- [CAMBIAR]: Nuevo nombre o nombres
    apellidos_usuario = 'Rodríguez Gómez',      -- [CAMBIAR]: Nuevos apellidos
    telefono_usuario = '3109876543',           -- [CAMBIAR]: Nuevo número de teléfono o celular
    rol_usuario = 'encargado_facturacion',     -- [CAMBIAR]: Rol válido ('admin', 'encargado_facturacion', 'encargado_logistico', 'cliente')
    email_usuario = 'carlos.rodriguez@email.com',-- [CAMBIAR]: Correo electrónico de contacto
    fecha_actualizacion = CURRENT_TIMESTAMP    -- [FIJO]: Actualiza la marca de tiempo de modificación
WHERE id_usuario = '1010203040';               -- [CAMBIAR]: Documento de identidad del usuario a modificar


-- =========================================================
-- 8. PLANTILLA: Eliminación Lógica de Usuario / Cliente
-- Realiza un borrado lógico manteniendo la integridad referencial histórica.
-- =========================================================

UPDATE usuario
SET estado_registro = FALSE,       -- [FIJO]: FALSE para desactivar sin borrar físicamente
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE id_usuario = '66778899';     -- [CAMBIAR]: Documento del usuario o cliente a desactivar