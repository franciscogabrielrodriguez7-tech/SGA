import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authApi } from "../../api/auth";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { toaster } from "../../components/ui/toaster";
import { phoneValidation } from "../../utils/validations";
import "./Login.css";

export function Login() {
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
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

    const valRes = phoneValidation.safeParse(telefono);
    if (!valRes.success) {
      toaster.create({
        title: "Teléfono inválido",
        description: valRes.error.errors[0].message,
        type: "warning",
      });
      return;
    }

    setCargando(true);

    try {
      const respuesta = await authApi.login({
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
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className="input"
              type={mostrarContrasena ? "text" : "password"}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMostrarContrasena(!mostrarContrasena)}
              title={mostrarContrasena ? "Ocultar contraseña" : "Ver contraseña"}
              style={{ padding: "0 0.75rem" }}
            >
              {mostrarContrasena ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={cargando}>
          {cargando ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}
