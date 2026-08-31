from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.schemas.usuario_schema import (
    ROLES_VALIDOS,
    TIPOS_DOCUMENTO_VALIDOS
)
from app.utils.security import (
    hashear_contrasena,
    verificar_contrasena
)

# NUEVO respecto a la variante sin JWT
from app.utils.jwt_utils import crear_access_token


# =========================================================
# CREAR USUARIO
# =========================================================

def crear_usuario(
    db: Session,
    datos
):

    # -----------------------------------------------------
    # VALIDAR ROL Y TIPO DE DOCUMENTO
    # (la BD ya lo valida con CHECK, pero se valida antes
    # para devolver un error de negocio claro, no un 500)
    # -----------------------------------------------------

    if datos.rol_usuario not in ROLES_VALIDOS:
        raise ValueError(
            f"rol_usuario debe ser uno de: {', '.join(ROLES_VALIDOS)}"
        )

    if datos.tipo_documento not in TIPOS_DOCUMENTO_VALIDOS:
        raise ValueError(
            f"tipo_documento debe ser uno de: {', '.join(TIPOS_DOCUMENTO_VALIDOS)}"
        )

    # -----------------------------------------------------
    # VERIFICAR QUE EL ID NO EXISTA
    # -----------------------------------------------------

    existente = db.execute(
        text("""
            SELECT id_usuario
            FROM usuario
            WHERE id_usuario = :id_usuario
        """),
        {
            "id_usuario": datos.id_usuario
        }
    ).first()

    if existente:
        raise ValueError(
            "Ya existe un usuario registrado con ese id_usuario"
        )

    # -----------------------------------------------------
    # VERIFICAR TELÉFONO ÚNICO (RN-CLI-06)
    # -----------------------------------------------------

    telefono_existente = db.execute(
        text("""
            SELECT id_usuario
            FROM usuario
            WHERE telefono_usuario = :telefono_usuario
        """),
        {
            "telefono_usuario": datos.telefono_usuario
        }
    ).first()

    if telefono_existente:
        raise ValueError(
            "Ya existe un usuario registrado con ese número de teléfono"
        )

    # -----------------------------------------------------
    # HASHEAR CONTRASEÑA (si viene)
    # -----------------------------------------------------

    contrasena_hasheada = None

    if datos.contrasena_usuario:
        contrasena_hasheada = hashear_contrasena(
            datos.contrasena_usuario
        )

    # -----------------------------------------------------
    # CREAR USUARIO
    # -----------------------------------------------------

    usuario = Usuario(
        id_usuario=datos.id_usuario,
        rol_usuario=datos.rol_usuario,
        nombres_usuario=datos.nombres_usuario,
        apellidos_usuario=datos.apellidos_usuario,
        email_usuario=datos.email_usuario,
        telefono_usuario=datos.telefono_usuario,
        contrasena_usuario=contrasena_hasheada,
        tipo_documento=datos.tipo_documento
    )

    db.add(usuario)

    db.commit()

    db.refresh(usuario)

    return usuario


# =========================================================
# OBTENER USUARIO POR ID
# =========================================================

def obtener_usuario(
    db: Session,
    id_usuario: str
):

    sql = text("""
        SELECT

            id_usuario,
            rol_usuario,
            nombres_usuario,
            apellidos_usuario,
            email_usuario,
            telefono_usuario,
            tipo_documento,
            fecha_creacion,
            fecha_actualizacion,
            estado_usuario

        FROM usuario

        WHERE id_usuario = :id_usuario
    """)

    resultado = db.execute(
        sql,
        {
            "id_usuario": id_usuario
        }
    ).first()

    if not resultado:
        return None

    return dict(resultado._mapping)


# =========================================================
# LISTAR USUARIOS (filtro opcional por rol)
# =========================================================

def obtener_usuarios(
    db: Session,
    rol_usuario: str = None
):

    sql = """
        SELECT

            id_usuario,
            rol_usuario,
            nombres_usuario,
            apellidos_usuario,
            email_usuario,
            telefono_usuario,
            tipo_documento,
            fecha_creacion,
            estado_usuario

        FROM usuario
    """

    parametros = {}

    if rol_usuario:
        sql += " WHERE rol_usuario = :rol_usuario"
        parametros["rol_usuario"] = rol_usuario

    sql += " ORDER BY nombres_usuario, apellidos_usuario"

    resultado = db.execute(text(sql), parametros)

    return [
        dict(row._mapping)
        for row in resultado
    ]


# =========================================================
# CAMBIAR ESTADO DE USUARIO (activar / desactivar, RN-USR-04/05)
# =========================================================

def cambiar_estado_usuario(
    db: Session,
    id_usuario: str,
    estado_usuario: bool
):

    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario
    ).first()

    if not usuario:
        return None

    usuario.estado_usuario = estado_usuario

    db.commit()

    db.refresh(usuario)

    return usuario


# =========================================================
# LOGIN (bcrypt)
# =========================================================

def login_usuario(
    db: Session,
    contrasena_plana: str,
    telefono_usuario: str = None,
    email_usuario: str = None
):

    if not telefono_usuario and not email_usuario:
        raise ValueError(
            "Debe indicar telefono_usuario o email_usuario para iniciar sesión"
        )

    if telefono_usuario:
        sql = text("""
            SELECT
                id_usuario,
                rol_usuario,
                nombres_usuario,
                apellidos_usuario,
                contrasena_usuario,
                estado_usuario
            FROM usuario
            WHERE telefono_usuario = :valor
        """)
        valor = telefono_usuario
    else:
        sql = text("""
            SELECT
                id_usuario,
                rol_usuario,
                nombres_usuario,
                apellidos_usuario,
                contrasena_usuario,
                estado_usuario
            FROM usuario
            WHERE email_usuario = :valor
        """)
        valor = email_usuario

    resultado = db.execute(
        sql,
        {
            "valor": valor
        }
    ).first()

    # -----------------------------------------------------
    # USUARIO NO EXISTE
    # -----------------------------------------------------

    if not resultado:
        return None

    # -----------------------------------------------------
    # USUARIO DESACTIVADO (RN-USR-05)
    # -----------------------------------------------------

    if not resultado.estado_usuario:
        raise ValueError(
            "El usuario está desactivado y no puede iniciar sesión"
        )

    # -----------------------------------------------------
    # VALIDAR CONTRASEÑA (bcrypt)
    # -----------------------------------------------------

    if not verificar_contrasena(
        contrasena_plana,
        resultado.contrasena_usuario
    ):
        return None

    # -----------------------------------------------------
    # LOGIN CORRECTO -> se emite el JWT (NUEVO)
    # -----------------------------------------------------

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
