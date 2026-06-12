const usuarios = [
    {
        usuario: "francisco",
        password: "123456",
        rol: "administrador",
        pagina: "admin.html"
    },
    {
        usuario: "jiselt",
        password: "123456",
        rol: "encargado_facturacion",
        pagina: "facturacion.html"
    },
    {
        usuario: "jacobo",
        password: "123456",
        rol: "encargado_logistico",
        pagina: "logistico.html"
    }
];

function ingresar() {
    const usuarioInput = document.getElementById("usuario").value.trim();
    const passwordInput = document.getElementById("password").value.trim();

    if (usuarioInput === "" || passwordInput === "") {
        alert("Digite usuario y contraseña");
        return;
    }

    const usuarioEncontrado = usuarios.find(user =>
        user.usuario === usuarioInput && user.password === passwordInput
    );

    if (!usuarioEncontrado) {
        alert("Usuario o contraseña incorrectos");
        return;
    }

    localStorage.setItem("usuarioActivo", usuarioEncontrado.usuario);
    localStorage.setItem("rolActivo", usuarioEncontrado.rol);

    window.location.href = usuarioEncontrado.pagina;
}

function reiniciarDatosDemo() {
    localStorage.removeItem("productos");
    localStorage.removeItem("alquileres");
    alert("Datos de prueba reiniciados. Ingrese nuevamente al sistema.");
}
