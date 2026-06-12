function validarAcceso(rolesPermitidos) {
    const rolActivo = localStorage.getItem("rolActivo");

    if (!rolActivo) {
        alert("Debe iniciar sesión");
        window.location.href = "index.html";
        return;
    }
}

function cerrarSesion() {
    localStorage.removeItem("usuarioActivo");
    localStorage.removeItem("rolActivo");
    window.location.href = "index.html";
}
