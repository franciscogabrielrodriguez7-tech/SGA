"""
roles.py
--------
NUEVO. Antes, `Depends(get_current_user)` solo validaba que el JWT
fuera válido (autenticación), pero NINGÚN endpoint verificaba el rol
del usuario contra lo que le corresponde hacer (autorización) — un
cliente autenticado podía, en la práctica, llamar cualquier endpoint,
incluyendo crear alquileres o administrar usuarios.

`requiere_rol(*roles_permitidos)` es una fábrica de dependencias: se
usa en cada ruta como `Depends(requiere_rol("admin", "encargado_facturacion"))`
y devuelve el `UsuarioActual` si su rol está permitido, o lanza 403 si
no lo está (403, no 401: el token es válido, el problema es que el rol
no alcanza — distinción exigida por el roadmap, sección 30).
"""

from fastapi import Depends, HTTPException

from app.utils.auth_dependency import get_current_user, UsuarioActual


def requiere_rol(*roles_permitidos: str):

    def dependencia(
        usuario: UsuarioActual = Depends(get_current_user)
    ) -> UsuarioActual:

        if usuario.rol_usuario not in roles_permitidos:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"El rol '{usuario.rol_usuario}' no tiene permiso para "
                    f"realizar esta operación. Roles permitidos: "
                    f"{', '.join(roles_permitidos)}."
                ),
            )

        return usuario

    return dependencia


# ----------------------------------------------------------------------------
# Grupos de roles reutilizables, según la matriz de autorización del
# roadmap (sección 26-27).
# ----------------------------------------------------------------------------

SOLO_ADMIN = ("admin",)

ADMIN_O_FACTURACION = ("admin", "encargado_facturacion")

ADMIN_O_LOGISTICO = ("admin", "encargado_logistico")

STAFF_INTERNO = ("admin", "encargado_facturacion", "encargado_logistico")
