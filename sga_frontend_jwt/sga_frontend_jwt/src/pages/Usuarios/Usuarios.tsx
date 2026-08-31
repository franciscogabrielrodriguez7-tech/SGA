import { useEffect, useState } from "react";

import { usuariosApi } from "../../api/usuarios";
import { ApiError } from "../../api/client";
import type { RolUsuario, TipoDocumento, Usuario } from "../../interfaces/Usuario";
import { toaster } from "../../components/ui/toaster";

const ROLES: RolUsuario[] = ["admin", "encargado_facturacion", "encargado_logistico", "cliente"];
const TIPOS_DOCUMENTO: TipoDocumento[] = ["CC", "CE", "NIT", "PPT"];

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroRol, setFiltroRol] = useState("");

  const [idUsuario, setIdUsuario] = useState("");
  const [rol, setRol] = useState<RolUsuario>("cliente");
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("CC");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [creando, setCreando] = useState(false);

  const cargar = () => {
    setCargando(true);
    usuariosApi
      .listar(filtroRol || undefined)
      .then(setUsuarios)
      .catch((error) => {
        const mensaje = error instanceof ApiError ? error.message : "Error al cargar usuarios";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      })
      .finally(() => setCargando(false));
  };

  useEffect(cargar, [filtroRol]);

  const manejarCrear = async () => {
    if (!idUsuario || !nombres || !apellidos || !telefono) {
      toaster.create({
        title: "Datos incompletos",
        description: "Documento, nombres, apellidos y teléfono son obligatorios.",
        type: "warning",
      });
      return;
    }

    setCreando(true);

    try {
      await usuariosApi.crear({
        id_usuario: idUsuario,
        rol_usuario: rol,
        tipo_documento: tipoDocumento,
        nombres_usuario: nombres,
        apellidos_usuario: apellidos,
        telefono_usuario: telefono,
        contrasena_usuario: contrasena || undefined,
      });

      toaster.create({ title: "Usuario creado", type: "success" });

      setIdUsuario("");
      setNombres("");
      setApellidos("");
      setTelefono("");
      setContrasena("");

      cargar();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : "No se pudo crear el usuario";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCreando(false);
    }
  };

  const manejarCambiarEstado = async (usuario: Usuario) => {
    try {
      await usuariosApi.cambiarEstado(usuario.id_usuario, !usuario.estado_usuario);
      toaster.create({ title: "Estado actualizado", type: "success" });
      cargar();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : "No se pudo cambiar el estado";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    }
  };

  return (
    <div className="stack gap-8">
      <h1 className="heading-xl">Usuarios</h1>

      <div className="card">
        <h2 className="heading-md" style={{ marginBottom: 16 }}>
          Nuevo usuario
        </h2>

        <div className="grid grid-cols-1 grid-cols-3-md" style={{ marginBottom: 16 }}>
          <div>
            <label className="field-label">Tipo de documento</label>
            <select className="input" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}>
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Número de documento</label>
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
            <label className="field-label">Contraseña (opcional para clientes)</label>
            <input className="input" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
          </div>
        </div>

        <button type="button" className="btn btn-primary" disabled={creando} onClick={manejarCrear}>
          {creando ? "Creando..." : "Crear usuario"}
        </button>
      </div>

      <div>
        <label className="field-label">Filtrar por rol</label>
        <select className="input" style={{ width: "auto" }} value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="">Todos</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id_usuario}>
                <td>{u.id_usuario}</td>
                <td>{u.nombres_usuario} {u.apellidos_usuario}</td>
                <td><span className="badge">{u.rol_usuario}</span></td>
                <td>{u.telefono_usuario}</td>
                <td>
                  <span className={`badge ${u.estado_usuario ? "" : "badge-gray"}`}>
                    {u.estado_usuario ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => manejarCambiarEstado(u)}>
                    {u.estado_usuario ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!cargando && usuarios.length === 0 && (
          <p className="table-empty">No hay usuarios registrados.</p>
        )}
      </div>
    </div>
  );
}
