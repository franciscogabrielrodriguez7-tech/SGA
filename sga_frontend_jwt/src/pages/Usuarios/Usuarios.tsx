import { useEffect, useState } from "react";

import { usuariosApi } from "../../api/usuarios";
import { ApiError } from "../../api/client";
import type { RolUsuario, TipoDocumento, Usuario } from "../../interfaces/Usuario";
import { toaster } from "../../components/ui/toaster";
import { useAuth } from "../../context/AuthContext";
import { SOLO_ADMIN, tienePermiso } from "../../utils/permisos";
import { phoneValidation } from "../../utils/validations";

import { CrearUsuarioSection } from "../../components/usuariosComponents/CrearUsuarioSection";
import { ListaUsuariosDesktop } from "../../components/usuariosComponents/ListaUsuariosDesktop";
import { ListaUsuariosMobile } from "../../components/usuariosComponents/ListaUsuariosMobile";
import { ModalEditarUsuario } from "../../components/usuariosComponents/ModalEditarUsuario";

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
    usuariosApi
      .listar(filtroRol || undefined)
      .then((data) => {
        if (!mostrarInactivos) {
          setUsuarios(data.filter(u => u.estado_registro));
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

    const resultadoTelefono = phoneValidation.safeParse(telefono);
    if (!resultadoTelefono.success) {
      toaster.create({
        title: "Teléfono inválido",
        description: resultadoTelefono.error.issues[0]?.message ?? "Teléfono inválido.",
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

    const resultadoTelefono = phoneValidation.safeParse(editTelefono);
    if (!resultadoTelefono.success) {
      toaster.create({
        title: "Teléfono inválido",
        description: resultadoTelefono.error.issues[0]?.message ?? "Teléfono inválido.",
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
    
    const nuevoEstado = !usuarioEditando.estado_registro;
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
        <CrearUsuarioSection
          tipoDocumento={tipoDocumento} setTipoDocumento={setTipoDocumento}
          idUsuario={idUsuario} setIdUsuario={setIdUsuario}
          rol={rol} setRol={setRol}
          nombres={nombres} setNombres={setNombres}
          apellidos={apellidos} setApellidos={setApellidos}
          telefono={telefono} setTelefono={setTelefono}
          email={email} setEmail={setEmail}
          contrasena={contrasena} setContrasena={setContrasena}
          creando={creando} manejarCrear={manejarCrear}
          TIPOS_DOCUMENTO={TIPOS_DOCUMENTO} ROLES={ROLES}
        />
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

      <ListaUsuariosDesktop
        usuarios={usuarios}
        cargando={cargando}
        puedeGestionar={puedeGestionar}
        abrirModalEdicion={abrirModalEdicion}
      />

      <ListaUsuariosMobile
        usuarios={usuarios}
        cargando={cargando}
        puedeGestionar={puedeGestionar}
        abrirModalEdicion={abrirModalEdicion}
      />

      <ModalEditarUsuario
        usuarioEditando={usuarioEditando}
        editRol={editRol} setEditRol={setEditRol}
        editNombres={editNombres} setEditNombres={setEditNombres}
        editApellidos={editApellidos} setEditApellidos={setEditApellidos}
        editTelefono={editTelefono} setEditTelefono={setEditTelefono}
        editEmail={editEmail} setEditEmail={setEditEmail}
        guardandoEdicion={guardandoEdicion} cambiandoEstado={cambiandoEstado}
        manejarCambiarEstado={manejarCambiarEstado} manejarGuardarEdicion={manejarGuardarEdicion}
        cerrarModal={cerrarModal} ROLES={ROLES}
      />

    </div>
  );
}
