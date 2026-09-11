"""
security.py
------------
Hashing de contraseñas con bcrypt, requerido explícitamente por el
proyecto (nunca se guarda ni compara texto plano).
"""

import bcrypt


def hashear_contrasena(contrasena_plana: str) -> str:
    """
    Genera el hash de una contraseña en texto plano para
    almacenarlo en usuario.contrasena_usuario.
    """

    hash_bytes = bcrypt.hashpw(
        contrasena_plana.encode("utf-8"),
        bcrypt.gensalt()
    )

    return hash_bytes.decode("utf-8")


def verificar_contrasena(
    contrasena_plana: str,
    contrasena_hasheada: str
) -> bool:
    """
    Compara una contraseña en texto plano contra el hash
    almacenado en la base de datos.
    """

    if not contrasena_hasheada:
        return False

    try:
        return bcrypt.checkpw(
            contrasena_plana.encode("utf-8"),
            contrasena_hasheada.encode("utf-8")
        )
    except ValueError:
        # El valor almacenado no es un hash bcrypt válido
        return False
