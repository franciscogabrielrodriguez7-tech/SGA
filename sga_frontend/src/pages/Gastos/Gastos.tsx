import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";

import { gastosApi } from "../../api/gastos";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { MovimientoLogistico, ResumenSemanal } from "../../interfaces/Logistica";
import { toaster } from "../../components/ui/toaster";
import { InputMoneda } from "../../components/inputs/InputMoneda";

export function Gastos() {
  const { usuario } = useAuth();

  const [gastos, setGastos] = useState<MovimientoLogistico[]>([]);
  const [resumen, setResumen] = useState<ResumenSemanal[]>([]);
  const [cargando, setCargando] = useState(true);

  const [idAlquiler, setIdAlquiler] = useState<number>(0);
  const [esRecogida, setEsRecogida] = useState(false);
  const [valor, setValor] = useState(0);
  const [descripcion, setDescripcion] = useState("");
  const [creando, setCreando] = useState(false);

  const cargar = () => {
    setCargando(true);
    Promise.all([gastosApi.listar(), gastosApi.resumenSemanal()])
      .then(([listaGastos, listaResumen]) => {
        setGastos(listaGastos);
        setResumen(listaResumen);
      })
      .catch((error) => {
        const mensaje = error instanceof ApiError ? error.message : "Error al cargar gastos";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      })
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const manejarCrear = async () => {
    if (!usuario) return;

    if (!idAlquiler || valor <= 0) {
      toaster.create({
        title: "Datos incompletos",
        description: "Debes indicar el id de alquiler y un valor mayor a 0.",
        type: "warning",
      });
      return;
    }

    setCreando(true);

    try {
      await gastosApi.crear({
        id_alquiler: idAlquiler,
        id_usuario_logistico: usuario.id_usuario,
        es_recogida: esRecogida,
        valor_gasto_logistico: valor,
        descripcion_gasto_logistico: descripcion || undefined,
      });

      toaster.create({ title: "Gasto registrado", type: "success" });

      setIdAlquiler(0);
      setValor(0);
      setDescripcion("");

      cargar();
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.message : "No se pudo registrar el gasto";
      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCreando(false);
    }
  };

  return (
    <Stack gap={8}>
      <Heading size="xl">Gastos logísticos</Heading>

      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={5}>
        <Heading size="md" mb={4}>
          Registrar gasto
        </Heading>

        <Text fontSize="sm" color="fg.muted" mb={4}>
          logistica_alquiler no distingue "gasto puro" de entrega/recogida: hay que indicar a
          cuál de las dos se asocia (según el backend).
        </Text>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={4}>
          <Box>
            <Text mb={2} fontWeight="medium">ID de alquiler</Text>
            <Input
              type="number"
              value={idAlquiler || ""}
              onChange={(e) => setIdAlquiler(Number(e.target.value))}
            />
          </Box>

          <Box>
            <Text mb={2} fontWeight="medium">Valor del gasto</Text>
            <InputMoneda value={valor} onChange={setValor} />
          </Box>

          <Box>
            <Text mb={2} fontWeight="medium">Descripción (opcional)</Text>
            <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </Box>
        </SimpleGrid>

        <Checkbox.Root
          checked={esRecogida}
          onCheckedChange={(c) => setEsRecogida(Boolean(c.checked))}
          mb={4}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Asociado a una recogida (si no, se asocia a una entrega)</Checkbox.Label>
        </Checkbox.Root>

        <Box>
          <Button onClick={manejarCrear} loading={creando} colorPalette="brand">
            Registrar gasto
          </Button>
        </Box>
      </Box>

      <Box>
        <Heading size="md" mb={3}>
          Resumen semanal (RN-GAS-07)
        </Heading>

        <Box borderWidth="1px" borderColor="border.default" borderRadius="md" overflowX="auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Semana</Table.ColumnHeader>
                <Table.ColumnHeader>Registros</Table.ColumnHeader>
                <Table.ColumnHeader>Total</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {resumen.map((r) => (
                <Table.Row key={r.semana_inicio}>
                  <Table.Cell>{r.semana_inicio}</Table.Cell>
                  <Table.Cell>{r.cantidad_registros}</Table.Cell>
                  <Table.Cell>${r.total_gasto.toLocaleString("es-CO")}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          {!cargando && resumen.length === 0 && (
            <Text p={4} color="fg.muted">Sin datos.</Text>
          )}
        </Box>
      </Box>

      <Box>
        <Heading size="md" mb={3}>
          Todos los gastos
        </Heading>

        <Box borderWidth="1px" borderColor="border.default" borderRadius="md" overflowX="auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Alquiler</Table.ColumnHeader>
                <Table.ColumnHeader>Responsable</Table.ColumnHeader>
                <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                <Table.ColumnHeader>Valor</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {gastos.map((g) => (
                <Table.Row key={g.id_logistica_alquiler}>
                  <Table.Cell>#{g.id_alquiler}</Table.Cell>
                  <Table.Cell>{g.nombres_logistico}</Table.Cell>
                  <Table.Cell>{g.fecha_gasto}</Table.Cell>
                  <Table.Cell>{g.es_recogida ? "Recogida" : "Entrega"}</Table.Cell>
                  <Table.Cell>${g.valor_gasto_logistico.toLocaleString("es-CO")}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          {!cargando && gastos.length === 0 && (
            <Text p={4} color="fg.muted">No hay gastos registrados.</Text>
          )}
        </Box>
      </Box>
    </Stack>
  );
}
