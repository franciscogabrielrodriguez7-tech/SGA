import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Badge,
} from "@chakra-ui/react";

import { productosApi } from "../../api/productos";
import { ApiError } from "../../api/client";
import type { Producto } from "../../interfaces/Producto";
import { toaster } from "../../components/ui/toaster";
import { InputMoneda } from "../../components/inputs/InputMoneda";

export function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioBase, setPrecioBase] = useState(0);
  const [stockTotal, setStockTotal] = useState(1);
  const [creando, setCreando] = useState(false);

  const cargar = () => {
    setCargando(true);
    productosApi
      .listar()
      .then(setProductos)
      .catch((error) => {
        const mensaje = error instanceof ApiError ? error.message : "Error al cargar productos";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      })
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const manejarCrear = async () => {
    if (!nombre || !descripcion || stockTotal < 1) {
      toaster.create({
        title: "Datos incompletos",
        description: "Nombre, descripción y stock total (mayor a 0) son obligatorios.",
        type: "warning",
      });
      return;
    }

    setCreando(true);

    try {
      await productosApi.crear({
        nombre_producto: nombre,
        descripcion_producto: descripcion,
        precio_base_producto: precioBase,
        stock_total: stockTotal,
      });

      toaster.create({ title: "Producto creado", type: "success" });

      setNombre("");
      setDescripcion("");
      setPrecioBase(0);
      setStockTotal(1);

      cargar();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : "No se pudo crear el producto";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCreando(false);
    }
  };

  return (
    <Stack gap={8}>
      <Heading size="xl">Productos</Heading>

      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={5}>
        <Heading size="md" mb={4}>
          Nuevo producto
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={4}>
          <Box>
            <Text mb={2} fontWeight="medium">Nombre</Text>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Box>

          <Box>
            <Text mb={2} fontWeight="medium">Descripción</Text>
            <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </Box>

          <Box>
            <Text mb={2} fontWeight="medium">Precio base</Text>
            <InputMoneda value={precioBase} onChange={setPrecioBase} />
          </Box>

          <Box>
            <Text mb={2} fontWeight="medium">Stock total</Text>
            <Input
              type="number"
              min={1}
              value={stockTotal}
              onChange={(e) => setStockTotal(Number(e.target.value))}
            />
          </Box>
        </SimpleGrid>

        <Button onClick={manejarCrear} loading={creando} colorPalette="brand">
          Crear producto
        </Button>
      </Box>

      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" overflowX="auto">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>Nombre</Table.ColumnHeader>
              <Table.ColumnHeader>Precio base</Table.ColumnHeader>
              <Table.ColumnHeader>Stock total</Table.ColumnHeader>
              <Table.ColumnHeader>Alquilado</Table.ColumnHeader>
              <Table.ColumnHeader>Disponible</Table.ColumnHeader>
              <Table.ColumnHeader>Estado</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {productos.map((p) => (
              <Table.Row key={p.id_producto}>
                <Table.Cell>{p.id_producto}</Table.Cell>
                <Table.Cell>{p.nombre_producto}</Table.Cell>
                <Table.Cell>${p.precio_base_producto.toLocaleString("es-CO")}</Table.Cell>
                <Table.Cell>{p.stock_total}</Table.Cell>
                <Table.Cell>{p.stock_alquilado}</Table.Cell>
                <Table.Cell>{p.stock_disponible}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={p.estado_registro ? "brand" : "gray"}>
                    {p.estado_registro ? "Activo" : "Inactivo"}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        {!cargando && productos.length === 0 && (
          <Text p={4} color="fg.muted">
            No hay productos registrados.
          </Text>
        )}
      </Box>

      <HStack />
    </Stack>
  );
}
