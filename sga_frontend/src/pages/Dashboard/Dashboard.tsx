import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  Badge,
  Link,
} from "@chakra-ui/react";

import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import type { Alquiler } from "../../interfaces/Alquiler";
import { toaster } from "../../components/ui/toaster";

function TarjetaAlquiler({ alquiler }: { alquiler: Alquiler }) {
  return (
    <Box asChild>
      <RouterLink
        to={`/alquileres/${alquiler.id_alquiler}`}
        style={{ textDecoration: "none" }}
      >
        <Box
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="md"
          p={4}
          bg="bg.surface"
          _hover={{ borderColor: "brand.400" }}
        >
          <Stack gap={1}>
            <Text fontWeight="semibold">
              #{alquiler.id_alquiler} — {alquiler.nombres_cliente}{" "}
              {alquiler.apellidos_cliente}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {alquiler.barrio} · vence {alquiler.fecha_vencimiento}
            </Text>
            <Badge colorPalette="brand" alignSelf="flex-start">
              {alquiler.estado_alquiler}
            </Badge>
          </Stack>
        </Box>
      </RouterLink>
    </Box>
  );
}

export function Dashboard() {
  const [proximosAVencer, setProximosAVencer] = useState<Alquiler[]>([]);
  const [pendientesEntrega, setPendientesEntrega] = useState<Alquiler[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const [vencer, entrega] = await Promise.all([
          alquileresApi.proximosAVencer(2),
          alquileresApi.pendientesEntrega(),
        ]);

        setProximosAVencer(vencer);
        setPendientesEntrega(entrega);
      } catch (error) {
        const mensaje =
          error instanceof ApiError ? error.message : "Error al cargar el panel";

        toaster.create({
          title: "Error",
          description: mensaje,
          type: "error",
        });
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, []);

  return (
    <Stack gap={8}>
      <Stack gap={1}>
        <Heading size="xl">Panel de control</Heading>
        <Text color="fg.muted">Resumen operativo de alquileres.</Text>
      </Stack>

      <Box>
        <Heading size="md" mb={3}>
          Próximos a vencer (2 días) — RN-VEN-01
        </Heading>

        {!cargando && proximosAVencer.length === 0 && (
          <Text color="fg.muted">No hay alquileres próximos a vencer.</Text>
        )}

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {proximosAVencer.map((a) => (
            <TarjetaAlquiler key={a.id_alquiler} alquiler={a} />
          ))}
        </SimpleGrid>
      </Box>

      <Box>
        <Heading size="md" mb={3}>
          Pendientes por entregar
        </Heading>

        {!cargando && pendientesEntrega.length === 0 && (
          <Text color="fg.muted">No hay alquileres pendientes de entrega.</Text>
        )}

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {pendientesEntrega.map((a) => (
            <TarjetaAlquiler key={a.id_alquiler} alquiler={a} />
          ))}
        </SimpleGrid>
      </Box>

      <Link asChild color="brand.600">
        <RouterLink to="/alquileres">Ver todos los alquileres →</RouterLink>
      </Link>
    </Stack>
  );
}
