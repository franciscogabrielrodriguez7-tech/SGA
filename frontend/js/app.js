function iniciarAplicacion() {
    iniciarDatos();

    const rol = document.body.dataset.role;

    cargarProductos();
    cargarAlquileres();

    if (rol === "administrador") {
        cargarEstadisticas();
        cargarUsuariosSistema();
        cargarReporteGeneral();
    }

    if (rol === "facturacion") {
        cargarSelectProductos();
    }
}

function cargarProductos() {
    const contenedor = document.getElementById("contenedorProductos");
    if (!contenedor) return;

    const productos = obtenerProductos();
    contenedor.innerHTML = "";

    productos.forEach(producto => {
        const claseStock = producto.stock <= 5 ? "stock-bajo" : "";

        contenedor.innerHTML += `
            <article class="producto-card ${claseStock}">
                <div class="icono-producto">🏗️</div>
                <h3>${producto.nombre}</h3>
                <p><b>Categoría:</b> ${producto.categoria}</p>
                <p><b>Proveedor:</b> ${producto.proveedor}</p>
                <p><b>Stock:</b> ${producto.stock}</p>
                <p><b>Precio día:</b> $${producto.precioDia.toLocaleString()}</p>
                <span class="estado disponible">${producto.estado}</span>
            </article>
        `;
    });
}

function cargarAlquileres() {
    const tabla = document.getElementById("tablaAlquileres");
    if (!tabla) return;

    const rol = document.body.dataset.role;
    const usuarioActivo = localStorage.getItem("usuarioActivo");
    let alquileres = obtenerAlquileres();

    tabla.innerHTML = "";

    if (rol === "cliente") {
        alquileres = alquileres.filter(alquiler => alquiler.cliente === usuarioActivo);
    }

    if (alquileres.length === 0) {
        tabla.innerHTML = `<tr><td colspan="9" class="vacio">No hay registros para mostrar</td></tr>`;
        return;
    }

    alquileres.forEach(alquiler => {
        if (rol === "administrador") {
            tabla.innerHTML += filaAdministrador(alquiler);
        }

        if (rol === "encargado_facturacion") {
            tabla.innerHTML += filaFacturacion(alquiler);
        }

        if (rol === "encargado_logistico") {
            tabla.innerHTML += filaLogistico(alquiler);
        }
    });
}

function filaAdministrador(alquiler) {
    return `
        <tr>
            <td>${alquiler.id}</td>
            <td>${alquiler.cliente}</td>
            <td>${alquiler.producto}</td>
            <td>${alquiler.cantidad}</td>
            <td>${alquiler.fechaInicio}</td>
            <td>${alquiler.fechaDevolucion}</td>
            <td><span class="estado">${alquiler.estado}</span></td>
            <td>$${alquiler.total.toLocaleString()}</td>
            <td>
                <button class="btn-small danger" onclick="eliminarAlquiler(${alquiler.id})">Eliminar</button>
            </td>
        </tr>
    `;
}

function filaFacturacion(alquiler) {
    return `
        <tr>
            <td>${alquiler.id}</td>
            <td>${alquiler.cliente}</td>
            <td>${alquiler.producto}</td>
            <td>${alquiler.cantidad}</td>
            <td>${alquiler.fechaInicio}</td>
            <td>${alquiler.fechaDevolucion}</td>
            <td><span class="estado">${alquiler.estado}</span></td>
            <td>$${alquiler.total.toLocaleString()}</td>
        </tr>
    `;
}

function filaLogistico(alquiler) {
    return `
        <tr>
            <td>${alquiler.id}</td>
            <td>${alquiler.cliente}</td>
            <td>${alquiler.producto}</td>
            <td>${alquiler.cantidad}</td>
            <td>${alquiler.direccion}</td>
            <td><span class="estado">${alquiler.estado}</span></td>
            <td>
                <button class="btn-small" onclick="cambiarEstado(${alquiler.id}, 'Entregado')">Entregado</button>
                <button class="btn-small success" onclick="cambiarEstado(${alquiler.id}, 'Devuelto')">Devuelto</button>
            </td>
        </tr>
    `;
}

function filaCliente(alquiler) {
    return `
        <tr>
            <td>${alquiler.id}</td>
            <td>${alquiler.producto}</td>
            <td>${alquiler.cantidad}</td>
            <td>${alquiler.fechaInicio}</td>
            <td>${alquiler.fechaDevolucion}</td>
            <td><span class="estado">${alquiler.estado}</span></td>
            <td>$${alquiler.total.toLocaleString()}</td>
        </tr>
    `;
}

function cargarSelectProductos() {
    const select = document.getElementById("productoSelect");
    if (!select) return;

    const productos = obtenerProductos();

    select.innerHTML = `<option value="">Seleccione producto</option>`;

    productos.forEach(producto => {
        select.innerHTML += `
            <option value="${producto.id}">
                ${producto.nombre} - Stock: ${producto.stock} - $${producto.precioDia.toLocaleString()} día
            </option>
        `;
    });
}

function registrarAlquiler(event) {
    event.preventDefault();

    const cliente = document.getElementById("cliente").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const direccion = document.getElementById("direccion").value.trim();
    const productoId = parseInt(document.getElementById("productoSelect").value);
    const cantidad = parseInt(document.getElementById("cantidad").value);
    const fechaInicio = document.getElementById("fechaInicio").value;
    const fechaDevolucion = document.getElementById("fechaDevolucion").value;

    const productos = obtenerProductos();
    const producto = productos.find(p => p.id === productoId);

    if (!producto) {
        alert("Seleccione un producto válido");
        return;
    }

    if (cantidad > producto.stock) {
        alert("No hay suficiente stock disponible");
        return;
    }

    const dias = calcularDias(fechaInicio, fechaDevolucion);

    if (dias <= 0) {
        alert("La fecha de devolución debe ser mayor a la fecha de inicio");
        return;
    }

    const total = producto.precioDia * cantidad * dias;
    const alquileres = obtenerAlquileres();

    const nuevoAlquiler = {
        id: Date.now(),
        cliente: cliente,
        telefono: telefono,
        direccion: direccion,
        producto: producto.nombre,
        cantidad: cantidad,
        fechaInicio: fechaInicio,
        fechaDevolucion: fechaDevolucion,
        estado: "Pendiente entrega",
        total: total
    };

    alquileres.push(nuevoAlquiler);
    producto.stock = producto.stock - cantidad;

    guardarAlquileres(alquileres);
    guardarProductos(productos);

    alert("Alquiler registrado correctamente");
    event.target.reset();

    cargarProductos();
    cargarAlquileres();
    cargarSelectProductos();
}

function calcularDias(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return (fin - inicio) / (1000 * 60 * 60 * 24);
}

function cambiarEstado(id, nuevoEstado) {
    const alquileres = obtenerAlquileres();
    const alquiler = alquileres.find(a => a.id === id);

    if (!alquiler) return;

    alquiler.estado = nuevoEstado;
    guardarAlquileres(alquileres);
    cargarAlquileres();

    alert("Estado actualizado a: " + nuevoEstado);
}

function eliminarAlquiler(id) {
    const confirmar = confirm("¿Desea eliminar este registro?");
    if (!confirmar) return;

    let alquileres = obtenerAlquileres();
    alquileres = alquileres.filter(alquiler => alquiler.id !== id);

    guardarAlquileres(alquileres);
    cargarAlquileres();
    cargarEstadisticas();
    cargarReporteGeneral();

    alert("Registro eliminado");
}

function cargarEstadisticas() {
    const contenedor = document.getElementById("estadisticas");
    if (!contenedor) return;

    const productos = obtenerProductos();
    const alquileres = obtenerAlquileres();

    const totalProductos = productos.length;
    const totalStock = productos.reduce((suma, producto) => suma + producto.stock, 0);
    const totalAlquileres = alquileres.length;
    const totalIngresos = alquileres.reduce((suma, alquiler) => suma + alquiler.total, 0);

    contenedor.innerHTML = `
        <article class="stat-card">
            <h3>${totalProductos}</h3>
            <p>Productos</p>
        </article>
        <article class="stat-card">
            <h3>${totalStock}</h3>
            <p>Stock total</p>
        </article>
        <article class="stat-card">
            <h3>${totalAlquileres}</h3>
            <p>Alquileres</p>
        </article>
        <article class="stat-card">
            <h3>$${totalIngresos.toLocaleString()}</h3>
            <p>Ingresos simulados</p>
        </article>
    `;
}

function cargarUsuariosSistema() {
    const contenedor = document.getElementById("usuariosSistema");
    if (!contenedor) return;

    const usuarios = [
        { nombre: "Administrador", usuario: "admin", rol: "Administrador" },
        { nombre: "Encargado de facturación", usuario: "factura", rol: "Encargado de facturación" },
        { nombre: "Encargado logístico", usuario: "logistica", rol: "Encargado logístico" }
    ];

    contenedor.innerHTML = "";

    usuarios.forEach(user => {
        contenedor.innerHTML += `
            <article class="usuario-card">
                <h3>${user.nombre}</h3>
                <p><b>Usuario:</b> ${user.usuario}</p>
                <span class="estado">${user.rol}</span>
            </article>
        `;
    });
}

function cargarReporteGeneral() {
    const contenedor = document.getElementById("reporteGeneral");
    if (!contenedor) return;

    const productos = obtenerProductos();
    const alquileres = obtenerAlquileres();

    const productoMasAlquilado = alquileres.length > 0 ? alquileres[0].producto : "Sin registros";
    const stockBajo = productos.filter(producto => producto.stock <= 5).length;

    contenedor.innerHTML = `
        <p><b>Producto de referencia:</b> ${productoMasAlquilado}</p>
        <p><b>Productos con stock bajo:</b> ${stockBajo}</p>
        <p><b>Observación:</b> Este reporte es visual y está hecho con datos simulados del frontend.</p>
    `;
}

iniciarAplicacion();
