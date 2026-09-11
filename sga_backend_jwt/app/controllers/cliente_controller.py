from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.usuario import Usuario
from app.utils.audit_context import set_audit_context
from app.utils.db_errors import extraer_mensaje_negocio


SELECT_CLIENTE_CAMPOS = """
    id_usuario,
    nombres_usuario,
    apellidos_usuario,
    email_usuario,
    telefono_usuario,
    tipo_documento,
    estado_registro,
    fecha_creacion,
    fecha_actualizacion
"""


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

    existente = db.execute(
        text("SELECT id_usuario FROM usuario WHERE id_usuario = :id_usuario"),
        {"id_usuario": datos.id_usuario}
    ).first()

    if existente:
        raise ValueError("Ya existe un usuario/cliente registrado con ese id_usuario")

    telefono_existente = db.execute(
        text("SELECT id_usuario FROM usuario WHERE telefono_usuario = :telefono"),
        {"telefono": datos.telefono_usuario}
    ).first()

    if telefono_existente:
        raise ValueError("Ya existe un usuario registrado con ese número de teléfono")

    if datos.email_usuario:
        email_existente = db.execute(
            text("SELECT id_usuario FROM usuario WHERE email_usuario = :email"),
            {"email": datos.email_usuario}
        ).first()
        if email_existente:
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

    sql = text(
        f"SELECT {SELECT_CLIENTE_CAMPOS} FROM usuario "
        "WHERE id_usuario = :id_usuario AND rol_usuario = 'cliente'"
    )

    resultado = db.execute(sql, {"id_usuario": id_usuario}).first()

    if not resultado:
        return None

    return dict(resultado._mapping)


# =========================================================
# LISTAR CLIENTES
# =========================================================

def obtener_clientes(db: Session, busqueda: str = None):

    sql = f"SELECT {SELECT_CLIENTE_CAMPOS} FROM usuario WHERE rol_usuario = 'cliente'"

    parametros = {}

    if busqueda:
        sql += """
            AND (
                nombres_usuario ILIKE :busqueda
                OR apellidos_usuario ILIKE :busqueda
                OR id_usuario ILIKE :busqueda
                OR telefono_usuario ILIKE :busqueda
            )
        """
        parametros["busqueda"] = f"%{busqueda}%"

    sql += " ORDER BY nombres_usuario, apellidos_usuario"

    resultado = db.execute(text(sql), parametros)

    return [dict(row._mapping) for row in resultado]


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
        duplicado = db.execute(
            text(
                "SELECT id_usuario FROM usuario "
                "WHERE telefono_usuario = :telefono AND id_usuario <> :id_usuario"
            ),
            {"telefono": campos["telefono_usuario"], "id_usuario": id_usuario}
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
