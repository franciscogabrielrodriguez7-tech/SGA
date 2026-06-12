const productosIniciales = [
    {
        id: 1,
        nombre: "Andamio ancho",
        categoria: "Andamios",
        stock: 20,
        estado: "Disponible"
    },
    {
        id: 2,
        nombre: "Andamio angosto",
        categoria: "Andamios",
        stock: 25,
        estado: "Disponible"
    },
    {
        id: 3,
        nombre: "Planchón",
        categoria: "Planchones",
        stock: 30,
        estado: "Disponible"
    },
    {
        id: 4,
        nombre: "Cruceta para andamio",
        categoria: "Crucetas",
        stock: 40,
        estado: "Disponible"
    }
];

const alquileresIniciales = [
    {
        id: 1001,
        cliente: "Carlos Ramírez",
        telefono: "3001234567",
        direccion: "Barrio Restrepo",
        producto: "Andamio ancho",
        cantidad: 2,
        fechaInicio: "2026-06-08",
        fechaDevolucion: "2026-06-12",
        estado: "Pendiente entrega"
    },
    {
        id: 1002,
        cliente: "Laura Gómez",
        telefono: "3019876543",
        direccion: "Kennedy Central",
        producto: "Planchón",
        cantidad: 4,
        fechaInicio: "2026-06-07",
        fechaDevolucion: "2026-06-10",
        estado: "Entregado"
    },
    {
        id: 1003,
        cliente: "cliente",
        telefono: "3025554444",
        direccion: "Suba",
        producto: "Cruceta",
        cantidad: 6,
        fechaInicio: "2026-06-05",
        fechaDevolucion: "2026-06-09",
        estado: "Devuelto",
    }
];

function iniciarDatos() {
    if (!localStorage.getItem("productos")) {
        localStorage.setItem("productos", JSON.stringify(productosIniciales));
    }

    if (!localStorage.getItem("alquileres")) {
        localStorage.setItem("alquileres", JSON.stringify(alquileresIniciales));
    }
}

function obtenerProductos() {
    return JSON.parse(localStorage.getItem("productos")) || [];
}

function guardarProductos(productos) {
    localStorage.setItem("productos", JSON.stringify(productos));
}

function obtenerAlquileres() {
    return JSON.parse(localStorage.getItem("alquileres")) || [];
}

function guardarAlquileres(alquileres) {
    localStorage.setItem("alquileres", JSON.stringify(alquileres));
}
