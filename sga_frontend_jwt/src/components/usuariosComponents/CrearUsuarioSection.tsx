import type { RolUsuario, TipoDocumento } from "../../interfaces/Usuario";

interface CrearUsuarioSectionProps {
  tipoDocumento: TipoDocumento;
  setTipoDocumento: (t: TipoDocumento) => void;
  idUsuario: string;
  setIdUsuario: (v: string) => void;
  rol: RolUsuario;
  setRol: (r: RolUsuario) => void;
  nombres: string;
  setNombres: (v: string) => void;
  apellidos: string;
  setApellidos: (v: string) => void;
  telefono: string;
  setTelefono: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  contrasena: string;
  setContrasena: (v: string) => void;
  creando: boolean;
  manejarCrear: () => void;
  TIPOS_DOCUMENTO: TipoDocumento[];
  ROLES: RolUsuario[];
}

export function CrearUsuarioSection({
  tipoDocumento, setTipoDocumento,
  idUsuario, setIdUsuario,
  rol, setRol,
  nombres, setNombres,
  apellidos, setApellidos,
  telefono, setTelefono,
  email, setEmail,
  contrasena, setContrasena,
  creando,
  manejarCrear,
  TIPOS_DOCUMENTO,
  ROLES
}: CrearUsuarioSectionProps) {
  return (
    <div className="card">
      <h2 className="heading-md" style={{ marginBottom: 16 }}>
        Nuevo usuario
      </h2>

      <div className="grid grid-cols-1 grid-cols-3-md" style={{ marginBottom: 16 }}>
        <div>
          <label className="field-label">Tipo doc.</label>
          <select className="input" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}>
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        
        <div className="col-span-2-md">
          <label className="field-label">Documento</label>
          <input className="input" value={idUsuario} onChange={(e) => setIdUsuario(e.target.value)} />
        </div>

        <div>
          <label className="field-label">Rol</label>
          <select className="input" value={rol} onChange={(e) => setRol(e.target.value as RolUsuario)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">Nombres</label>
          <input className="input" value={nombres} onChange={(e) => setNombres(e.target.value)} />
        </div>

        <div>
          <label className="field-label">Apellidos</label>
          <input className="input" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
        </div>

        <div>
          <label className="field-label">Teléfono</label>
          <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        
        <div>
          <label className="field-label">Correo Electrónico</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="field-label">Contraseña inicial</label>
          <input className="input" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
        </div>
      </div>

      <button type="button" className="btn btn-primary" disabled={creando} onClick={manejarCrear}>
        {creando ? "Creando..." : "Crear usuario"}
      </button>
    </div>
  );
}
