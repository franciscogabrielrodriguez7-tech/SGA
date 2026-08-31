// ============================================================================
// AuthContext.tsx — VARIANTE CON JWT
// ----------------------------------------------------------------------------
// El backend de esta variante SÍ emite un JWT en POST /usuarios/login
// (campo "access_token" en la respuesta). Este contexto guarda ese token
// junto con los datos del usuario, y src/api/client.ts lo adjunta
// automáticamente como header "Authorization: Bearer <token>" en cada
// petición (ver ese archivo). Si el backend responde 401 (token vencido
// o inválido), el cliente HTTP dispara "sesionExpirada" y este contexto
// cierra la sesión automáticamente.
// ============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { LoginResponse } from "../interfaces/Usuario";
import { toaster } from "../components/ui/toaster";

const STORAGE_KEY = "sga_sesion_usuario";

interface AuthContextValue {
  usuario: LoginResponse | null;
  token: string | null;
  estaAutenticado: boolean;
  iniciarSesion: (datos: LoginResponse) => void;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<LoginResponse | null>(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    return guardado ? (JSON.parse(guardado) as LoginResponse) : null;
  });

  useEffect(() => {
    if (usuario) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [usuario]);

  const iniciarSesion = (datos: LoginResponse) => {
    setUsuario(datos);
  };

  const cerrarSesion = () => {
    setUsuario(null);
  };

  // Si src/api/client.ts detecta un 401 en cualquier petición (token
  // vencido/inválido), dispara este evento global para forzar el
  // cierre de sesión desde cualquier parte de la app sin acoplar el
  // cliente HTTP al contexto de React.
  useEffect(() => {
    const manejarSesionExpirada = () => {
      cerrarSesion();

      toaster.create({
        title: "Sesión expirada",
        description: "Vuelve a iniciar sesión para continuar.",
        type: "warning",
      });
    };

    window.addEventListener("sesionExpirada", manejarSesionExpirada);

    return () =>
      window.removeEventListener("sesionExpirada", manejarSesionExpirada);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token: usuario?.access_token ?? null,
        estaAutenticado: usuario !== null,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }

  return contexto;
}

