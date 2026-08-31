import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Badge,
} from "@chakra-ui/react";

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
      // Aquí se reflejan mensajes como "Ya existe un usuario registrado
      // con ese número de teléfono" (RN-CLI-06), tal como los devuelve
      // el backend.
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
    <Stack gap={8}>
      <Heading size="xl">Usuarios</Heading>

      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={5}>
        <Heading size="md" mb={4}>
          Nuevo usuario
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={4}>
          <Box>
            <Text mb={2} fontWeight="medium">Tipo de documento</Text>
            <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}>
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Box>

          <Box>
            <Text mb={2} fontWeight="medium">Número de documento</Text>
            <Input value={idUsuario} onChange={(e) => setIdUsuario(e.target.value)} />
          </Box>

          <Box>
            <Text mb={2} fontWeight="medium">Rol</Text>
            <select value={rol} onChange={(e) => setRol(e.target.value as RolUsuario)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Box>

          <Box>
            <Text mb={2} fontWeight="medium">Nombres</Text>
            <Input value={nombres} onChange={(e) => setNombres(e.target.value)} />
          </Box>

          <Box>
            <Text mb={2} fontWeight="medium">Apellidos</Text>
            <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
          </Box>

          <Box>
            <Text mb={2} fontWeight="medium">Teléfono</Text>
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </Box>

          <Box>
            <Text mb={2} fontWeight="medium">Contraseña (opcional para clientes)</Text>
            <Input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
          </Box>
        </SimpleGrid>

        <Button onClick={manejarCrear} loading={creando} colorPalette="brand">
          Crear usuario
        </Button>
      </Box>

      <Box>
        <Text mb={2} fontWeight="medium">Filtrar por rol</Text>
        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="">Todos</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </Box>

      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" overflowX="auto">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Documento</Table.ColumnHeader>
              <Table.ColumnHeader>Nombre</Table.ColumnHeader>
              <Table.ColumnHeader>Rol</Table.ColumnHeader>
              <Table.ColumnHeader>Teléfono</Table.ColumnHeader>
              <Table.ColumnHeader>Estado</Table.ColumnHeader>
              <Table.ColumnHeader></Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {usuarios.map((u) => (
              <Table.Row key={u.id_usuario}>
                <Table.Cell>{u.id_usuario}</Table.Cell>
                <Table.Cell>{u.nombres_usuario} {u.apellidos_usuario}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette="brand">{u.rol_usuario}</Badge>
                </Table.Cell>
                <Table.Cell>{u.telefono_usuario}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={u.estado_usuario ? "brand" : "gray"}>
                    {u.estado_usuario ? "Activo" : "Inactivo"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Button size="sm" variant="outline" onClick={() => manejarCambiarEstado(u)}>
                    {u.estado_usuario ? "Desactivar" : "Activar"}
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        {!cargando && usuarios.length === 0 && (
          <Text p={4} color="fg.muted">
            No hay usuarios registrados.
          </Text>
        )}
      </Box>
    </Stack>
  );
}
