import type { ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../ui/ThemeToggle";
import "./AppShell.css";

const ITEMS_NAV = [
  { ruta: "/", etiqueta: "Inicio" },
  { ruta: "/alquileres", etiqueta: "Alquileres" },
  { ruta: "/alquileres/nuevo", etiqueta: "Crear alquiler" },
  { ruta: "/productos", etiqueta: "Productos" },
  { ruta: "/usuarios", etiqueta: "Usuarios" },
  { ruta: "/gastos", etiqueta: "Gastos" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();

  return (
    <div className="appshell">
      <nav className="appshell-sidebar">
        <div className="appshell-logo">SGA</div>

        {ITEMS_NAV.map((item) => {
          const activo = location.pathname === item.ruta;

          return (
            <RouterLink
              key={item.ruta}
              to={item.ruta}
              className={`appshell-navlink${activo ? " appshell-navlink-active" : ""}`}
            >
              {item.etiqueta}
            </RouterLink>
          );
        })}
      </nav>

      <div className="appshell-main">
        <header className="appshell-topbar">
          <span className="heading-md">SGA</span>

          <div className="hstack gap-4" style={{ marginLeft: "auto" }}>
            {usuario && (
              <div className="hstack gap-2">
                <span className="text-sm">
                  {usuario.nombres_usuario} {usuario.apellidos_usuario}
                </span>
                <span className="badge">{usuario.rol_usuario}</span>
              </div>
            )}

            <ThemeToggle />

            <button type="button" className="btn btn-outline btn-sm" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <div className="appshell-content">{children}</div>
      </div>
    </div>
  );
}
