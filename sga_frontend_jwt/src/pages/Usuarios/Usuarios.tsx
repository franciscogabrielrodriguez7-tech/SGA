import { useEffect, useState } from "react";

import { usuariosApi } from "../../api/usuarios";
import { ApiError } from "../../api/client";
import type { RolUsuario, TipoDocumento, Usuario } from "../../interfaces/Usuario";
import { toaster } from "../../components/ui/toaster";
import { useAuth } from "../../context/AuthContext";
import { SOLO_ADMIN, tienePermiso } from "../../utils/permisos";
import { phoneValidation } from "../../utils/validations";

// Solo los 3 roles internos son actores reales de esta pantalla de
// administración: 'cliente' se gestiona desde /clientes.
const ROLES: RolUsuario[] = ["admin", "encargado_facturacion", "encargado_logistico"];
const TIPOS_DOCUMENTO: TipoDocumento[] = ["CC", "CE", "NIT", "PPT"];

export function Usuarios() {
  const { usuario: usuarioSesion } = useAuth();
  const puedeGestionar = tienePermiso(usuarioSesion?.rol_usuario, SOLO_ADMIN);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroRol, setFiltroRol] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Form states (Crear)
  const [idUsuario, setIdUsuario] = useState("");
  const [rol, setRol] = useState<RolUsuario>("encargado_logistico");
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("CC");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [creando, setCreando] = useState(false);

  // Modal states (Editar)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [editRol, setEditRol] = useState<RolUsuario>("encargado_logistico");
  const [editNombres, setEditNombres] = useState("");
  const [editApellidos, setEditApellidos] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const cargar = () => {
    setCargando(true);
    // El backend no filtra usuarios inactivos automáticamente en el listado,
    // así que lo filtramos en el frontend según el toggle (igual que con productos,
    // pero el endpoint de usuarios no tiene un parametro solo_activos implementado,
    // trae todos).
    usuariosApi
      .listar(filtroRol || undefined)
      .then((data) => {
        if (!mostrarInactivos) {
          setUsuarios(data.filter(u => u.estado_usuario));
        } else {
          setUsuarios(data);
        }
      })
      .catch((error) => {
        const mensaje = error instanceof ApiError ? error.message : "Error al cargar usuarios";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      })
      .finally(() => setCargando(false));
  };

  useEffect(cargar, [filtroRol, mostrarInactivos]);

  const manejarCrear = async () => {
    if (!idUsuario || !nombres || !apellidos || !telefono) {
      toaster.create({
        title: "Datos incompletos",
        description: "Documento, nombres, apellidos y teléfono son obligatorios.",
        type: "warning",
      });
      return;
    }

    if (!phoneValidation.isValid(telefono)) {
      toaster.create({
        title: "Teléfono inválido",
        description: phoneValidation.message,
        type: "error",
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
        email_usuario: email || null,
        contrasena_usuario: contrasena || null,
      });

      toaster.create({ title: "Usuario creado", type: "success" });

      setIdUsuario("");
      setNombres("");
      setApellidos("");
      setTelefono("");
      setEmail("");
      setContrasena("");
      setRol("encargado_logistico");
      setTipoDocumento("CC");

      cargar();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : "No se pudo crear el usuario";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCreando(false);
    }
  };

  const abrirModalEdicion = (usuario: Usuario) => {
    if (!puedeGestionar) return;
    setUsuarioEditando(usuario);
    setEditRol(usuario.rol_usuario);
    setEditNombres(usuario.nombres_usuario);
    setEditApellidos(usuario.apellidos_usuario);
    setEditTelefono(usuario.telefono_usuario);
    setEditEmail(usuario.email_usuario || "");
  };

  const cerrarModal = () => {
    setUsuarioEditando(null);
  };

  const manejarGuardarEdicion = async () => {
    if (!usuarioEditando) return;
    
    if (!editNombres || !editApellidos || !editTelefono) {
      toaster.create({
        title: "Datos incompletos",
        description: "Nombres, apellidos y teléfono son obligatorios.",
        type: "warning",
      });
      return;
    }

    if (!phoneValidation.isValid(editTelefono)) {
      toaster.create({
        title: "Teléfono inválido",
        description: phoneValidation.message,
        type: "error",
      });
      return;
    }

    setGuardandoEdicion(true);
    try {
      await usuariosApi.actualizar(usuarioEditando.id_usuario, {
        rol_usuario: editRol,
        nombres_usuario: editNombres,
        apellidos_usuario: editApellidos,
        telefono_usuario: editTelefono,
        email_usuario: editEmail || null,
      });
      toaster.create({ title: "Usuario actualizado", type: "success" });
      cargar();
      cerrarModal();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : "Error al actualizar usuario";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const manejarCambiarEstado = async () => {
    if (!usuarioEditando) return;
    
    const nuevoEstado = !usuarioEditando.estado_usuario;
    const accion = nuevoEstado ? "Activar" : "Desactivar";

    if (!window.confirm(`¿Estás seguro de ${accion.toLowerCase()} a este usuario?`)) return;

    setCambiandoEstado(true);
    try {
      await usuariosApi.cambiarEstado(usuarioEditando.id_usuario, nuevoEstado);
      toaster.create({ title: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} con éxito`, type: "success" });
      cargar();
      cerrarModal();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : `Error al ${accion.toLowerCase()} el usuario`;
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCambiandoEstado(false);
    }
  };

  return (
    <div className="stack gap-8">
      <h1 className="heading-xl">Usuarios (Personal)</h1>

      {puedeGestionar && (
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
            
            <div style={{ gridColumn: "span 2" }}>
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
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <label className="field-label">Filtrar por rol</label>
          <select className="input" style={{ width: "auto" }} value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
            <option value="">Todos</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        
        {puedeGestionar && (
          <label className="checkbox-row">
            <input 
              type="checkbox" 
              checked={mostrarInactivos} 
              onChange={(e) => setMostrarInactivos(e.target.checked)} 
            />
            <span className="text-sm">Mostrar usuarios inactivos</span>
          </label>
        )}
      </div>

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
              const opaco = !u.estado_usuario;
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
                    <span className={`badge ${u.estado_usuario ? "" : "badge-gray"}`}>
                      {u.estado_usuario ? "Activo" : "Inactivo"}
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

      <div className="show-mobile-cards">
        {usuarios.map((u) => {
          const opaco = !u.estado_usuario;
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
                <span className={`badge ${u.estado_usuario ? "" : "badge-gray"}`}>
                  {u.estado_usuario ? "Activo" : "Inactivo"}
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

      {/* MODAL DE EDICIÓN */}
      {usuarioEditando && (
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
                style={{ color: usuarioEditando.estado_usuario ? "var(--color-danger)" : "var(--color-primary)", borderColor: "currentColor" }}
              >
                {cambiandoEstado ? "Procesando..." : (usuarioEditando.estado_usuario ? "Desactivar Usuario" : "Activar Usuario")}
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
      )}

    </div>
  );
}
