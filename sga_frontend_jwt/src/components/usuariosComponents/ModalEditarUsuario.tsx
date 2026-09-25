import type { RolUsuario, Usuario } from "../../interfaces/Usuario";

interface ModalEditarUsuarioProps {
  usuarioEditando: Usuario | null;
  editRol: RolUsuario;
  setEditRol: (r: RolUsuario) => void;
  editNombres: string;
  setEditNombres: (v: string) => void;
  editApellidos: string;
  setEditApellidos: (v: string) => void;
  editTelefono: string;
  setEditTelefono: (v: string) => void;
  editEmail: string;
  setEditEmail: (v: string) => void;
  guardandoEdicion: boolean;
  cambiandoEstado: boolean;
  manejarCambiarEstado: () => void;
  manejarGuardarEdicion: () => void;
  cerrarModal: () => void;
  ROLES: RolUsuario[];
}

export function ModalEditarUsuario({
  usuarioEditando,
  editRol, setEditRol,
  editNombres, setEditNombres,
  editApellidos, setEditApellidos,
  editTelefono, setEditTelefono,
  editEmail, setEditEmail,
  guardandoEdicion,
  cambiandoEstado,
  manejarCambiarEstado,
  manejarGuardarEdicion,
  cerrarModal,
  ROLES
}: ModalEditarUsuarioProps) {
  if (!usuarioEditando) return null;

  return (
    <div className="modal-overlay" onClick={cerrarModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="heading-lg">Editar Usuario</h2>
          <button className="btn" onClick={cerrarModal} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        <div className="stack gap-4" style={{ marginBottom: 24 }}>
          <p className="text-sm text-muted">
            Documento: <strong style={{ color: "var(--color-fg-default)" }}>{usuarioEditando.tipo_documento} {usuarioEditando.id_usuario}</strong>
          </p>
          
          <div className="grid grid-cols-1 grid-cols-2-md">
            <div>
              <label className="field-label">Nombres</label>
              <input className="input" value={editNombres} onChange={(e) => setEditNombres(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Apellidos</label>
              <input className="input" value={editApellidos} onChange={(e) => setEditApellidos(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 grid-cols-2-md">
            <div>
              <label className="field-label">Teléfono</label>
              <input className="input" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Correo Electrónico</label>
              <input className="input" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="field-label">Rol del sistema</label>
            <select className="input" value={editRol} onChange={(e) => setEditRol(e.target.value as RolUsuario)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={manejarCambiarEstado}
            disabled={cambiandoEstado || guardandoEdicion}
            style={{ color: usuarioEditando.estado_registro ? "var(--color-danger)" : "var(--color-primary)", borderColor: "currentColor" }}
          >
            {cambiandoEstado ? "Procesando..." : (usuarioEditando.estado_registro ? "Desactivar Usuario" : "Activar Usuario")}
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-outline" onClick={cerrarModal}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={manejarGuardarEdicion} disabled={guardandoEdicion || cambiandoEstado}>
              {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
