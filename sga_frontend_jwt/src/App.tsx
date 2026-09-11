import { Routes, Route } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { ADMIN_O_FACTURACION } from "./utils/permisos";

import { Login } from "./pages/Login/Login";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { ListaAlquileres } from "./pages/Alquileres/ListaAlquileres";
import { AlquilerDetalle } from "./pages/Alquileres/AlquilerDetalle";
import { CrearAlquiler } from "./pages/CrearAlquiler/CrearAlquiler";
import { Productos } from "./pages/Productos/Productos";
import { Usuarios } from "./pages/Usuarios/Usuarios";
import { Gastos } from "./pages/Gastos/Gastos";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/alquileres" element={<ListaAlquileres />} />
                <Route
                  path="/alquileres/nuevo"
                  element={
                    // POST /alquileres es ADMIN_O_FACTURACION en el backend
                    // (app/routes/alquiler_routes.py). encargado_logistico
                    // recibiria 403 si llegara aqui.
                    <ProtectedRoute rolesPermitidos={ADMIN_O_FACTURACION}>
                      <CrearAlquiler />
                    </ProtectedRoute>
                  }
                />
                <Route path="/alquileres/:id" element={<AlquilerDetalle />} />
                <Route path="/productos" element={<Productos />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/gastos" element={<Gastos />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
