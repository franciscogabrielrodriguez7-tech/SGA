import type { Usuario } from "../../interfaces/Usuario";

interface ListaUsuariosMobileProps {
  usuarios: Usuario[];
  cargando: boolean;
  puedeGestionar: boolean;
  abrirModalEdicion: (u: Usuario) => void;
}

export function ListaUsuariosMobile({
  usuarios,
  cargando,
  puedeGestionar,
  abrirModalEdicion
}: ListaUsuariosMobileProps) {
  return (
    <div className="show-mobile-cards">
      {usuarios.map((u) => {
        const opaco = !u.estado_registro;
        return (
          <div
            key={u.id_usuario}
            onClick={() => abrirModalEdicion(u)}
            className="list-card"
            style={{
              cursor: puedeGestionar ? "pointer" : "default",
              opacity: opaco ? 0.6 : 1,
            }}
          >
            <div className="list-card-header">
              <span className="list-card-title">{u.nombres_usuario} {u.apellidos_usuario}</span>
              <span className={`badge ${u.estado_registro ? "" : "badge-gray"}`}>
                {u.estado_registro ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="stack gap-1">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="text-sm text-muted">Doc: {u.id_usuario}</span>
                <span className="text-sm text-muted">{u.telefono_usuario}</span>
              </div>
              <div>
                <span className="badge badge-lg" style={{ marginTop: 4 }}>{u.rol_usuario}</span>
              </div>
            </div>
          </div>
        );
      })}
      {!cargando && usuarios.length === 0 && (
        <p className="text-muted">No hay usuarios registrados.</p>
      )}
    </div>
  );
}
