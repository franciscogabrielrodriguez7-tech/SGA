import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { tienePermiso } from "../../utils/permisos";
import type { RolUsuario } from "../../interfaces/Usuario";

interface ProtectedRouteProps {
  children: ReactNode;
  // Si se indica, ademas de estar autenticado, el rol del usuario debe
  // estar en esta lista (ver app/utils/roles.py del backend). Si no se
  // indica, solo se exige sesion activa.
  rolesPermitidos?: RolUsuario[];
}

export function ProtectedRoute({ children, rolesPermitidos }: ProtectedRouteProps) {
  const { estaAutenticado, usuario } = useAuth();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !tienePermiso(usuario?.rol_usuario, rolesPermitidos)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
