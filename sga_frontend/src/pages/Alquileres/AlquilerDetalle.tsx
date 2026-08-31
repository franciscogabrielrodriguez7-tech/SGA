import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";

import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { Alquiler, EstadoAlquiler } from "../../interfaces/Alquiler";
import { ESTADOS_ALQUILER } from "../../interfaces/Alquiler";
import type { MovimientoLogistico } from "../../interfaces/Logistica";
import { toaster } from "../../components/ui/toaster";

export function AlquilerDetalle() {
  const { id } = useParams<{ id: string }>();
  const idAlquiler = Number(id);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [alquiler, setAlquiler] = useState<Alquiler | null>(null);
  const [entregas, setEntregas] = useState<MovimientoLogistico[]>([]);
  const [recogidas, setRecogidas] = useState<MovimientoLogistico[]>([]);
  const [cargando, setCargando] = useState(true);

  const [nuevoEstado, setNuevoEstado] = useState<EstadoAlquiler | "">("");
  const [semanasRenovacion, setSemanasRenovacion] = useState(1);
  const [observacionesEntrega, setObservacionesEntrega] = useState("");
  const [observacionesRecogida, setObservacionesRecogida] = useState("");

  const cargarTodo = async () => {
    setCargando(true);

    try {
      const [detalle, listaEntregas, listaRecogidas] = await Promise.all([
        alquileresApi.consultar(idAlquiler),
        alquileresApi.listarEntregas(idAlquiler),
        alquileresApi.listarRecogidas(idAlquiler),
      ]);

      setAlquiler(detalle);
      setEntregas(listaEntregas);
      setRecogidas(listaRecogidas);
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "Error al cargar el alquiler";

      toaster.create({ title: "Error", description: mensaje, type: "error" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idAlquiler]);

  const manejarCambioEstado = async () => {
    if (!nuevoEstado) return;

    try {
      const actualizado = await alquileresApi.cambiarEstado(idAlquiler, nuevoEstado);
      setAlquiler(actualizado);
      setNuevoEstado("");

      toaster.create({
        title: "Estado actualizado",
        description: `El alquiler ahora está en estado '${actualizado.estado_alquiler}'.`,
        type: "success",
      });
    } catch (error) {
      // Aquí se refleja, por ejemplo, "Transición no permitida:
      // 'pendiente' -> 'recogido' (RN-EST-01 a 06)" tal como lo devuelve
      // el backend.
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo cambiar el estado";

      toaster.create({ title: "Transición no permitida", description: mensaje, type: "error" });
    }
  };

  const manejarRenovar = async () => {
    try {
      const actualizado = await alquileresApi.renovar(idAlquiler, semanasRenovacion);
      setAlquiler(actualizado);

      toaster.create({
        title: "Alquiler renovado",
        description: `Nueva fecha de vencimiento: ${actualizado.fecha_vencimiento}`,
        type: "success",
      });
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo renovar el alquiler";

      toaster.create({ title: "Renovación no permitida", description: mensaje, type: "error" });
    }
  };

  const manejarRegistrarEntrega = async () => {
    if (!usuario) return;

    try {
      await alquileresApi.registrarEntrega(idAlquiler, {
        id_usuario_logistico: usuario.id_usuario,
        observaciones_logistica_alquiler: observacionesEntrega || undefined,
      });

      toaster.create({
        title: "Entrega registrada",
        description: "El alquiler pasó a estado 'activo'.",
        type: "success",
      });

      setObservacionesEntrega("");
      cargarTodo();
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo registrar la entrega";

      toaster.create({ title: "Entrega no permitida", description: mensaje, type: "error" });
    }
  };

  const manejarRegistrarRecogida = async () => {
    if (!usuario) return;

    try {
      await alquileresApi.registrarRecogida(idAlquiler, {
        id_usuario_logistico: usuario.id_usuario,
        observaciones_logistica_alquiler: observacionesRecogida || undefined,
      });

      toaster.create({
        title: "Recogida registrada",
        description: "El alquiler pasó a estado 'recogido' y el stock fue devuelto.",
        type: "success",
      });

      setObservacionesRecogida("");
      cargarTodo();
    } catch (error) {
      // Aquí se refleja RN-LOG-04 ("No se puede registrar una recogida
      // sin una entrega previa...") si aplica.
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo registrar la recogida";

      toaster.create({ title: "Recogida no permitida", description: mensaje, type: "error" });
    }
  };

  const manejarCancelar = async () => {
    if (!confirm("¿Cancelar este alquiler? Esta acción no se puede deshacer.")) return;

    try {
      const actualizado = await alquileresApi.cancelar(idAlquiler);
      setAlquiler(actualizado);

      toaster.create({ title: "Alquiler cancelado", type: "success" });
    } catch (error) {
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo cancelar el alquiler";

      toaster.create({ title: "Cancelación no permitida", description: mensaje, type: "error" });
    }
  };

  if (cargando) {
    return <Text>Cargando...</Text>;
  }

  if (!alquiler) {
    return <Text>El alquiler no existe.</Text>;
  }

  return (
    <Stack gap={8}>
      <HStack justify="space-between">
        <Stack gap={1}>
          <Heading size="xl">Alquiler #{alquiler.id_alquiler}</Heading>
          <HStack>
            <Badge colorPalette="brand" size="lg">
              {alquiler.estado_alquiler}
            </Badge>
            <Text color="fg.muted">Vence: {alquiler.fecha_vencimiento}</Text>
          </HStack>
        </Stack>

        <Button variant="outline" onClick={() => navigate("/alquileres")}>
          ← Volver
        </Button>
      </HStack>

      {/* Datos generales */}
      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={5}>
        <Stack gap={2}>
          <Text>
            <b>Cliente:</b> {alquiler.nombres_cliente} {alquiler.apellidos_cliente} (
            {alquiler.id_usuario_cliente})
          </Text>
          <Text>
            <b>Creado por:</b> {alquiler.nombres_creador} {alquiler.apellidos_creador}
          </Text>
          <Text>
            <b>Dirección:</b> {alquiler.direccion} — {alquiler.barrio}
          </Text>
          <Text>
            <b>Depósito:</b> ${alquiler.deposito.toLocaleString("es-CO")}
          </Text>
          <Text>
            <b>Precio del alquiler:</b> ${alquiler.precio_alquiler.toLocaleString("es-CO")}
          </Text>
          <Text>
            <b>Fecha de inicio:</b> {alquiler.fecha_inicio} — {alquiler.tiempo_alquiler} semana(s)
          </Text>
          <Text>
            <b>Logística:</b> {alquiler.se_lleva ? "Se lleva" : "No se lleva"} ·{" "}
            {alquiler.se_recoge ? "Se recoge" : "No se recoge"}
          </Text>
        </Stack>
      </Box>

      {/* Detalle de productos */}
      <Box>
        <Heading size="md" mb={3}>
          Productos
        </Heading>

        <Box borderWidth="1px" borderColor="border.default" borderRadius="md" overflowX="auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Producto</Table.ColumnHeader>
                <Table.ColumnHeader>Cantidad</Table.ColumnHeader>
                <Table.ColumnHeader>Precio conjunto</Table.ColumnHeader>
                <Table.ColumnHeader>Extra</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {alquiler.detalles.map((d) => (
                <Table.Row key={d.id_detalle_alquiler}>
                  <Table.Cell>{d.nombre_producto}</Table.Cell>
                  <Table.Cell>{d.cantidad_productos}</Table.Cell>
                  <Table.Cell>${d.precio_conjunto.toLocaleString("es-CO")}</Table.Cell>
                  <Table.Cell>{d.es_producto_extra ? "Sí" : "No"}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>

      {/* Acciones de estado */}
      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={5}>
        <Heading size="md" mb={4}>
          Cambiar estado
        </Heading>

        <HStack gap={3}>
          <select
            value={nuevoEstado}
            onChange={(e) => setNuevoEstado(e.target.value as EstadoAlquiler)}
          >
            <option value="">Selecciona un estado</option>
            {ESTADOS_ALQUILER.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>

          <Button onClick={manejarCambioEstado} disabled={!nuevoEstado} colorPalette="brand">
            Aplicar
          </Button>

          <Button variant="outline" colorPalette="red" onClick={manejarCancelar} ml="auto">
            Cancelar alquiler
          </Button>
        </HStack>

        <Text fontSize="sm" color="fg.muted" mt={2}>
          El backend valida la secuencia oficial (pendiente → activo → vencido → recogido →
          terminado, con cancelado como alternativa) y rechaza transiciones inválidas.
        </Text>
      </Box>

      {/* Renovación */}
      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={5}>
        <Heading size="md" mb={4}>
          Renovar (RN-REN)
        </Heading>

        <HStack>
          <Input
            type="number"
            min={1}
            value={semanasRenovacion}
            onChange={(e) => setSemanasRenovacion(Number(e.target.value))}
            maxW="140px"
          />
          <Text>semanas</Text>
          <Button onClick={manejarRenovar} colorPalette="brand">
            Renovar
          </Button>
        </HStack>

        <Text fontSize="sm" color="fg.muted" mt={2}>
          Solo disponible cuando el alquiler está 'activo' o 'vencido'.
        </Text>
      </Box>

      {/* Entregas */}
      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={5}>
        <Heading size="md" mb={4}>
          Entregas
        </Heading>

        <Stack gap={2} mb={4}>
          {entregas.length === 0 && (
            <Text color="fg.muted" fontSize="sm">
              Aún no hay entregas registradas.
            </Text>
          )}
          {entregas.map((e) => (
            <Box key={e.id_logistica_alquiler} borderWidth="1px" borderRadius="md" p={3} fontSize="sm">
              <Text>{e.fecha_gasto} — {e.nombres_logistico}</Text>
              {e.observaciones_logistica_alquiler && <Text color="fg.muted">{e.observaciones_logistica_alquiler}</Text>}
            </Box>
          ))}
        </Stack>

        <Stack gap={2}>
          <Input
            placeholder="Observaciones de la entrega (opcional)"
            value={observacionesEntrega}
            onChange={(e) => setObservacionesEntrega(e.target.value)}
          />
          <Button onClick={manejarRegistrarEntrega} alignSelf="flex-start" colorPalette="brand">
            Registrar entrega
          </Button>
        </Stack>
      </Box>

      {/* Recogidas */}
      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={5}>
        <Heading size="md" mb={4}>
          Recogidas
        </Heading>

        <Stack gap={2} mb={4}>
          {recogidas.length === 0 && (
            <Text color="fg.muted" fontSize="sm">
              Aún no hay recogidas registradas.
            </Text>
          )}
          {recogidas.map((r) => (
            <Box key={r.id_logistica_alquiler} borderWidth="1px" borderRadius="md" p={3} fontSize="sm">
              <Text>{r.fecha_gasto} — {r.nombres_logistico}</Text>
              {r.observaciones_logistica_alquiler && <Text color="fg.muted">{r.observaciones_logistica_alquiler}</Text>}
            </Box>
          ))}
        </Stack>

        <Stack gap={2}>
          <Input
            placeholder="Observaciones de la recogida (opcional)"
            value={observacionesRecogida}
            onChange={(e) => setObservacionesRecogida(e.target.value)}
          />
          <Button onClick={manejarRegistrarRecogida} alignSelf="flex-start" colorPalette="brand">
            Registrar recogida
          </Button>
        </Stack>

        <Text fontSize="sm" color="fg.muted" mt={2}>
          RN-LOG-04: no se permite registrar una recogida sin una entrega previa.
        </Text>
      </Box>
    </Stack>
  );
}
