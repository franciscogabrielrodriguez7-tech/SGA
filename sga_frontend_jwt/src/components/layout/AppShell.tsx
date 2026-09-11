import { useState, type ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ADMIN_O_FACTURACION, tienePermiso } from "../../utils/permisos";
import type { RolUsuario } from "../../interfaces/Usuario";
import "./AppShell.css";

const ITEMS_NAV: { ruta: string; etiqueta: string; roles?: RolUsuario[] }[] = [
  { ruta: "/", etiqueta: "Inicio" },
  { ruta: "/alquileres", etiqueta: "Alquileres" },
  // POST /alquileres es ADMIN_O_FACTURACION en el backend: no mostrar el
  // enlace a encargado_logistico, que recibiría 403.
  { ruta: "/alquileres/nuevo", etiqueta: "Crear alquiler", roles: ADMIN_O_FACTURACION },
  { ruta: "/productos", etiqueta: "Productos" },
  { ruta: "/usuarios", etiqueta: "Usuarios" },
  { ruta: "/gastos", etiqueta: "Gastos" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const cerrarMenuMovil = () => setMenuMovilAbierto(false);

  return (
    <div className="appshell">
      {menuMovilAbierto && (
        <div
          className="appshell-overlay"
          onClick={cerrarMenuMovil}
          aria-hidden="true"
        />
      )}

      <nav className={`appshell-sidebar${menuMovilAbierto ? " appshell-sidebar-open" : ""}`}>
        <div className="appshell-logo">SGA</div>

        {ITEMS_NAV.filter(
          (item) => !item.roles || tienePermiso(usuario?.rol_usuario, item.roles),
        ).map((item) => {
          const activo = location.pathname === item.ruta;

          return (
            <RouterLink
              key={item.ruta}
              to={item.ruta}
              onClick={cerrarMenuMovil}
              className={`appshell-navlink${activo ? " appshell-navlink-active" : ""}`}
            >
              {item.etiqueta}
            </RouterLink>
          );
        })}
      </nav>

      <div className="appshell-main">
        <header className="appshell-topbar">
          <button
            type="button"
            className="appshell-menu-btn"
            onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
            aria-label="Abrir menú de navegación"
            aria-expanded={menuMovilAbierto}
          >
            ☰
          </button>

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
