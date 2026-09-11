"""
roles.py
--------
`requiere_rol(*roles_permitidos)` es una fábrica de dependencias: se
usa en cada ruta como `Depends(requiere_rol("admin", "encargado_facturacion"))`
y devuelve el `UsuarioActual` si su rol está permitido, o lanza 403 si
no lo está (403, no 401: el token es válido, el problema es que el rol
no alcanza).

JERARQUÍA DE PERMISOS (regla de negocio explícita del proyecto):
    admin  >  encargado_facturacion  >  encargado_logistico  >  cliente

`encargado_facturacion` puede hacer todo lo que hace
`encargado_logistico`, pero no al revés. Por eso los grupos que
incluyen a `encargado_logistico` (STAFF_INTERNO) también incluyen
siempre a `encargado_facturacion` y a `admin`; nunca existe un grupo
que incluya a `encargado_logistico` sin incluir también a
`encargado_facturacion`. `cliente` NUNCA aparece en ningún grupo: no
tiene acceso al sistema (regla de negocio explícita).
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
# proyecto y la jerarquía admin > encargado_facturacion > encargado_logistico.
# ----------------------------------------------------------------------------

SOLO_ADMIN = ("admin",)

ADMIN_O_FACTURACION = ("admin", "encargado_facturacion")

ADMIN_O_LOGISTICO = ("admin", "encargado_logistico")

STAFF_INTERNO = ("admin", "encargado_facturacion", "encargado_logistico")
