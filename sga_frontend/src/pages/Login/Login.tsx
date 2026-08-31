import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";

import { usuariosApi } from "../../api/usuarios";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { toaster } from "../../components/ui/toaster";

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
      // Aquí es donde se refleja, por ejemplo, "Credenciales incorrectas"
      // (401) o "El usuario está desactivado..." (400) que devuelve
      // exactamente el backend.
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
    <Box minH="100svh" display="flex" alignItems="center" justifyContent="center" bg="bg.app">
      <Box
        as="form"
        onSubmit={manejarSubmit}
        w="360px"
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border.default"
        borderRadius="lg"
        boxShadow="md"
        p={8}
      >
        <Stack gap={5}>
          <Stack gap={1}>
            <Heading size="lg" color="brand.700">
              SGA
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Sistema de Gestión de Alquileres de Andamios
            </Text>
          </Stack>

          <Stack gap={1}>
            <Text fontSize="sm" fontWeight="medium">
              Teléfono
            </Text>
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="3001234567"
              autoFocus
            />
          </Stack>

          <Stack gap={1}>
            <Text fontSize="sm" fontWeight="medium">
              Contraseña
            </Text>
            <Input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
            />
          </Stack>

          <Button type="submit" colorPalette="brand" loading={cargando}>
            Iniciar sesión
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
