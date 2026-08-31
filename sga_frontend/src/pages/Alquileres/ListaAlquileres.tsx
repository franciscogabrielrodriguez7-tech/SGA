import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Stack,
  Table,
  Badge,
  Text,
} from "@chakra-ui/react";

import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import type { Alquiler, EstadoAlquiler } from "../../interfaces/Alquiler";
import { ESTADOS_ALQUILER } from "../../interfaces/Alquiler";
import { toaster } from "../../components/ui/toaster";

export function ListaAlquileres() {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [cargando, setCargando] = useState(true);

  const [filtroEstado, setFiltroEstado] = useState<EstadoAlquiler | "">("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaBarrio, setBusquedaBarrio] = useState("");

  const cargarLista = async () => {
    setCargando(true);

    try {
      const resultado =
        busquedaCliente || busquedaBarrio
          ? await alquileresApi.buscar({
              cliente: busquedaCliente || undefined,
              barrio: busquedaBarrio || undefined,
            })
          : await alquileresApi.listar({
              estado_alquiler: filtroEstado || undefined,
            });

      setAlquileres(resultado);
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "Error al consultar alquileres";

      toaster.create({
        title: "Error",
        description: mensaje,
        type: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado]);

  return (
    <Stack gap={6}>
      <HStack justify="space-between">
        <Heading size="xl">Alquileres</Heading>
        <Button asChild colorPalette="brand">
          <RouterLink to="/alquileres/nuevo">+ Crear alquiler</RouterLink>
        </Button>
      </HStack>

      {/* Filtros / búsqueda */}
      <HStack gap={3} flexWrap="wrap">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as EstadoAlquiler | "")}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_ALQUILER.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>

        <Input
          placeholder="Buscar por cliente"
          value={busquedaCliente}
          onChange={(e) => setBusquedaCliente(e.target.value)}
          maxW="220px"
        />

        <Input
          placeholder="Buscar por barrio"
          value={busquedaBarrio}
          onChange={(e) => setBusquedaBarrio(e.target.value)}
          maxW="220px"
        />

        <Button variant="outline" onClick={cargarLista}>
          Buscar
        </Button>
      </HStack>

      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" overflowX="auto">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>Cliente</Table.ColumnHeader>
              <Table.ColumnHeader>Barrio</Table.ColumnHeader>
              <Table.ColumnHeader>Estado</Table.ColumnHeader>
              <Table.ColumnHeader>Vencimiento</Table.ColumnHeader>
              <Table.ColumnHeader></Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {alquileres.map((alquiler) => (
              <Table.Row key={alquiler.id_alquiler}>
                <Table.Cell>{alquiler.id_alquiler}</Table.Cell>
                <Table.Cell>
                  {alquiler.nombres_cliente} {alquiler.apellidos_cliente}
                </Table.Cell>
                <Table.Cell>{alquiler.barrio}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette="brand">{alquiler.estado_alquiler}</Badge>
                </Table.Cell>
                <Table.Cell>{alquiler.fecha_vencimiento}</Table.Cell>
                <Table.Cell>
                  <Button asChild size="sm" variant="outline">
                    <RouterLink to={`/alquileres/${alquiler.id_alquiler}`}>Ver</RouterLink>
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        {!cargando && alquileres.length === 0 && (
          <Text p={4} color="fg.muted">
            No se encontraron alquileres.
          </Text>
        )}
      </Box>
    </Stack>
  );
}
