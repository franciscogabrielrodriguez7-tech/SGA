"""
security.py
------------
NUEVO respecto al esqueleto de referencia: la API Veterinaria de
ejemplo comparaba contraseñas en texto plano. Para SGA se decidió
explícitamente usar hashing con bcrypt, así que este archivo no
tiene equivalente en el ejemplo original.
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
        # (por ejemplo, datos de prueba antiguos en texto plano).
        return False
