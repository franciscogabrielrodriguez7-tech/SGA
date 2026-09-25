from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.usuario import Usuario
from app.utils.audit_context import set_audit_context
from app.utils.db_errors import extraer_mensaje_negocio



# =========================================================
# CREAR CLIENTE
# -----------------------------------------------------------
# rol_usuario SIEMPRE se fuerza a 'cliente' aquí — nunca se toma del
# payload (ClienteCreate ni siquiera expone ese campo, ver
# cliente_schema.py). Un cliente registrado en punto de venta no
# recibe contraseña (RN-CLI-01): el campo queda NULL, tal como lo
# permite explícitamente el esquema.
# =========================================================

def crear_cliente(db: Session, datos, usuario_actual):

    if db.query(Usuario).filter(Usuario.id_usuario == datos.id_usuario).first():
        raise ValueError("Ya existe un usuario/cliente registrado con ese id_usuario")

    if db.query(Usuario).filter(Usuario.telefono_usuario == datos.telefono_usuario).first():
        raise ValueError("Ya existe un usuario registrado con ese número de teléfono")

    if datos.email_usuario:
        if db.query(Usuario).filter(Usuario.email_usuario == datos.email_usuario).first():
            raise ValueError("Ya existe un usuario registrado con ese correo electrónico")

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        cliente = Usuario(
            id_usuario=datos.id_usuario,
            rol_usuario="cliente",
            nombres_usuario=datos.nombres_usuario,
            apellidos_usuario=datos.apellidos_usuario,
            email_usuario=datos.email_usuario,
            telefono_usuario=datos.telefono_usuario,
            contrasena_usuario=None,
            tipo_documento=datos.tipo_documento
        )

        db.add(cliente)
        db.commit()
        db.refresh(cliente)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return cliente


# =========================================================
# OBTENER CLIENTE POR ID
# =========================================================

def obtener_cliente(db: Session, id_usuario: str):

    return db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario,
        Usuario.rol_usuario == "cliente"
    ).first()


# =========================================================
# LISTAR CLIENTES
# =========================================================

def obtener_clientes(db: Session, busqueda: str = None):

    query = db.query(Usuario).filter(Usuario.rol_usuario == "cliente")

    if busqueda:
        patron = f"%{busqueda}%"
        query = query.filter(
            Usuario.nombres_usuario.ilike(patron)
            | Usuario.apellidos_usuario.ilike(patron)
            | Usuario.id_usuario.ilike(patron)
            | Usuario.telefono_usuario.ilike(patron)
        )

    return query.order_by(Usuario.nombres_usuario, Usuario.apellidos_usuario).all()


# =========================================================
# ACTUALIZAR CLIENTE
# =========================================================

def actualizar_cliente(db: Session, id_usuario: str, datos, usuario_actual):

    cliente = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario,
        Usuario.rol_usuario == "cliente"
    ).first()

    if not cliente:
        return None

    campos = datos.model_dump(exclude_unset=True)

    if not campos:
        return obtener_cliente(db, id_usuario)

    if "telefono_usuario" in campos:
        duplicado = db.query(Usuario).filter(
            Usuario.telefono_usuario == campos["telefono_usuario"],
            Usuario.id_usuario != id_usuario
        ).first()
        if duplicado:
            raise ValueError("Ya existe otro usuario registrado con ese teléfono")

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        for campo, valor in campos.items():
            setattr(cliente, campo, valor)

        db.commit()
        db.refresh(cliente)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return cliente


# =========================================================
# CAMBIAR ESTADO (borrado lógico)
# =========================================================

def cambiar_estado_cliente(db: Session, id_usuario: str, estado_registro: bool, usuario_actual):

    cliente = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario,
        Usuario.rol_usuario == "cliente"
    ).first()

    if not cliente:
        return None

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        cliente.estado_registro = estado_registro
        db.commit()
        db.refresh(cliente)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return cliente
