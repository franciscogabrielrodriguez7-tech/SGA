import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { usuariosApi } from "../../api/usuarios";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { toaster } from "../../components/ui/toaster";
import "./Login.css";

export function Login() {
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!telefono || !contrasena) {
      toaster.create({
        title: "Faltan datos",
        description: "Ingresa teléfono y contraseña.",
        type: "warning",
      });
      return;
    }

    setCargando(true);

    try {
      const respuesta = await usuariosApi.login({
        telefono_usuario: telefono,
        contrasena_usuario: contrasena,
      });

      iniciarSesion(respuesta);

      toaster.create({
        title: `Bienvenido, ${respuesta.nombres_usuario}`,
        type: "success",
      });

      navigate("/");
    } catch (error) {
      const mensaje =
        error instanceof ApiError
          ? error.message
          : "No se pudo iniciar sesión.";

      toaster.create({
        title: "Error al iniciar sesión",
        description: mensaje,
        type: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card stack gap-5" onSubmit={manejarSubmit}>
        <div className="stack gap-1">
          <h1 className="heading-xl text-brand">SGA</h1>
          <p className="text-muted text-sm">
            Sistema de Gestión de Alquileres de Andamios
          </p>
        </div>

        <div>
          <label className="field-label">Teléfono</label>
          <input
            className="input"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="3001234567"
            autoFocus
          />
        </div>

        <div>
          <label className="field-label">Contraseña</label>
          <input
            className="input"
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={cargando}>
          {cargando ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
