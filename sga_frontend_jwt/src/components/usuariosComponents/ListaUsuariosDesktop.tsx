import type { Usuario } from "../../interfaces/Usuario";

interface ListaUsuariosDesktopProps {
  usuarios: Usuario[];
  cargando: boolean;
  puedeGestionar: boolean;
  abrirModalEdicion: (u: Usuario) => void;
}

export function ListaUsuariosDesktop({
  usuarios,
  cargando,
  puedeGestionar,
  abrirModalEdicion
}: ListaUsuariosDesktopProps) {
  return (
    <div className="table-wrap hide-on-mobile">
      <table className="table">
        <thead>
          <tr>
            <th>Documento</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Teléfono</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => {
            const opaco = !u.estado_registro;
            return (
              <tr 
                key={u.id_usuario}
                onClick={() => abrirModalEdicion(u)}
                style={{ 
                  cursor: puedeGestionar ? "pointer" : "default",
                  opacity: opaco ? 0.5 : 1,
                  transition: "opacity 0.2s"
                }}
                title={puedeGestionar ? "Haz clic para editar" : ""}
                className={puedeGestionar ? "row-hover" : ""}
              >
                <td className="text-bold">{u.id_usuario}</td>
                <td>{u.nombres_usuario} {u.apellidos_usuario}</td>
                <td><span className="badge">{u.rol_usuario}</span></td>
                <td>{u.telefono_usuario}</td>
                <td>
                  <span className={`badge ${u.estado_registro ? "" : "badge-gray"}`}>
                    {u.estado_registro ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!cargando && usuarios.length === 0 && (
        <p className="table-empty">No hay usuarios registrados.</p>
      )}
    </div>
  );
}
