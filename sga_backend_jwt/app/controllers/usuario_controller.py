from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError

from app.models.usuario import Usuario
from app.utils.security import hashear_contrasena, verificar_contrasena
from app.utils.jwt_utils import crear_access_token
from app.utils.audit_context import set_audit_context
from app.utils.db_errors import extraer_mensaje_negocio


SELECT_USUARIO_CAMPOS = """
    id_usuario,
    rol_usuario,
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
# CREAR USUARIO (personal interno)
# =========================================================

def crear_usuario(db: Session, datos, usuario_actual):

    existente = db.execute(
        text("SELECT id_usuario FROM usuario WHERE id_usuario = :id_usuario"),
        {"id_usuario": datos.id_usuario}
    ).first()

    if existente:
        raise ValueError("Ya existe un usuario registrado con ese id_usuario")

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

        usuario = Usuario(
            id_usuario=datos.id_usuario,
            rol_usuario=datos.rol_usuario,
            nombres_usuario=datos.nombres_usuario,
            apellidos_usuario=datos.apellidos_usuario,
            email_usuario=datos.email_usuario,
            telefono_usuario=datos.telefono_usuario,
            contrasena_usuario=hashear_contrasena(datos.contrasena_usuario),
            tipo_documento=datos.tipo_documento
        )

        db.add(usuario)
        db.commit()
        db.refresh(usuario)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return usuario


# =========================================================
# OBTENER USUARIO POR ID
# =========================================================

def obtener_usuario(db: Session, id_usuario: str):

    sql = text(f"SELECT {SELECT_USUARIO_CAMPOS} FROM usuario WHERE id_usuario = :id_usuario")

    resultado = db.execute(sql, {"id_usuario": id_usuario}).first()

    if not resultado:
        return None

    return dict(resultado._mapping)


# =========================================================
# LISTAR USUARIOS DE PERSONAL
# -----------------------------------------------------------
# Por defecto EXCLUYE rol_usuario='cliente' (los clientes se
# gestionan en /api/sga/clientes). Si se filtra explícitamente por
# rol_usuario='cliente', sí se incluyen (decisión de diseño para no
# duplicar innecesariamente el listado de clientes en dos módulos
# distintos salvo que se pida a propósito).
# =========================================================

def obtener_usuarios(db: Session, rol_usuario: str = None):

    sql = f"SELECT {SELECT_USUARIO_CAMPOS} FROM usuario"

    parametros = {}

    if rol_usuario:
        sql += " WHERE rol_usuario = :rol_usuario"
        parametros["rol_usuario"] = rol_usuario
    else:
        sql += " WHERE rol_usuario <> 'cliente'"

    sql += " ORDER BY nombres_usuario, apellidos_usuario"

    resultado = db.execute(text(sql), parametros)

    return [dict(row._mapping) for row in resultado]


# =========================================================
# ACTUALIZAR USUARIO
# =========================================================

def actualizar_usuario(db: Session, id_usuario: str, datos, usuario_actual):

    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()

    if not usuario:
        return None

    campos = datos.model_dump(exclude_unset=True)

    if not campos:
        return obtener_usuario(db, id_usuario)

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

    if "email_usuario" in campos and campos["email_usuario"]:
        duplicado = db.execute(
            text(
                "SELECT id_usuario FROM usuario "
                "WHERE email_usuario = :email AND id_usuario <> :id_usuario"
            ),
            {"email": campos["email_usuario"], "id_usuario": id_usuario}
        ).first()
        if duplicado:
            raise ValueError("Ya existe otro usuario registrado con ese correo electrónico")

    if "contrasena_usuario" in campos:
        campos["contrasena_usuario"] = hashear_contrasena(campos.pop("contrasena_usuario"))

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        for campo, valor in campos.items():
            setattr(usuario, campo, valor)

        db.commit()
        db.refresh(usuario)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return usuario


# =========================================================
# CAMBIAR ESTADO (activar / desactivar -> borrado lógico)
# -----------------------------------------------------------
# Los triggers trg_impedir_autodesactivacion_admin y
# trg_garantizar_minimo_un_admin (ver database/02_funciones_y_triggers.sql)
# ya protegen contra que un admin se desactive a sí mismo o que el
# sistema se quede sin administradores activos — el controller no
# duplica esa validación, deja que la BD la aplique y traduce el error.
# =========================================================

def cambiar_estado_usuario(db: Session, id_usuario: str, estado_registro: bool, usuario_actual):

    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()

    if not usuario:
        return None

    try:
        set_audit_context(db, usuario_actual.id_usuario)

        usuario.estado_registro = estado_registro
        db.commit()
        db.refresh(usuario)

    except DBAPIError as error:
        db.rollback()
        raise ValueError(extraer_mensaje_negocio(error))

    return usuario


# =========================================================
# LOGIN (bcrypt + emisión de JWT)
# =========================================================

def login_usuario(
    db: Session,
    contrasena_plana: str,
    telefono_usuario: str = None,
    email_usuario: str = None
):

    if not telefono_usuario and not email_usuario:
        raise ValueError("Debe indicar telefono_usuario o email_usuario para iniciar sesión")

    if telefono_usuario:
        sql = text("""
            SELECT id_usuario, rol_usuario, nombres_usuario, apellidos_usuario,
                   contrasena_usuario, estado_registro
            FROM usuario WHERE telefono_usuario = :valor
        """)
        valor = telefono_usuario
    else:
        sql = text("""
            SELECT id_usuario, rol_usuario, nombres_usuario, apellidos_usuario,
                   contrasena_usuario, estado_registro
            FROM usuario WHERE email_usuario = :valor
        """)
        valor = email_usuario

    resultado = db.execute(sql, {"valor": valor}).first()

    if not resultado:
        return None

    if resultado.rol_usuario == "cliente":
        raise ValueError("Los usuarios con rol 'cliente' no tienen acceso al sistema")

    if not resultado.estado_registro:
        raise ValueError("El usuario está desactivado y no puede iniciar sesión")

    if not verificar_contrasena(contrasena_plana, resultado.contrasena_usuario):
        return None

    access_token = crear_access_token(
        id_usuario=resultado.id_usuario,
        rol_usuario=resultado.rol_usuario
    )

    return {
        "logueado": True,
        "id_usuario": resultado.id_usuario,
        "rol_usuario": resultado.rol_usuario,
        "nombres_usuario": resultado.nombres_usuario,
        "apellidos_usuario": resultado.apellidos_usuario,
        "access_token": access_token,
        "token_type": "bearer"
    }
