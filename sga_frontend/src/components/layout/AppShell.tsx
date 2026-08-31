import type { ReactNode } from "react";
import { Box, Flex, HStack, Stack, Text, Button, Badge } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ColorModeButton } from "../ui/color-mode";

const ITEMS_NAV = [
  { ruta: "/", etiqueta: "Inicio" },
  { ruta: "/alquileres", etiqueta: "Alquileres" },
  { ruta: "/alquileres/nuevo", etiqueta: "Crear alquiler" },
  { ruta: "/productos", etiqueta: "Productos" },
  { ruta: "/usuarios", etiqueta: "Usuarios" },
  { ruta: "/gastos", etiqueta: "Gastos" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();

  return (
    <Flex minH="100svh" bg="bg.app">
      {/* Barra lateral */}
      <Stack
        as="nav"
        w="240px"
        flexShrink={0}
        bg="bg.surface"
        borderRightWidth="1px"
        borderColor="border.default"
        p={4}
        gap={1}
        display={{ base: "none", md: "flex" }}
      >
        <Text fontWeight="bold" fontSize="lg" mb={4} color="brand.700">
          SGA
        </Text>

        {ITEMS_NAV.map((item) => {
          const activo = location.pathname === item.ruta;

          return (
            <Box key={item.ruta} asChild>
              <RouterLink
                to={item.ruta}
                style={{
                  display: "block",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  fontWeight: activo ? 600 : 400,
                  background: activo ? "var(--chakra-colors-brand-100)" : "transparent",
                  color: activo ? "var(--chakra-colors-brand-700)" : "var(--chakra-colors-fg-default)",
                  textDecoration: "none",
                }}
              >
                {item.etiqueta}
              </RouterLink>
            </Box>
          );
        })}
      </Stack>

      {/* Contenido */}
      <Box flex="1" minW={0}>
        {/* Barra superior */}
        <Flex
          as="header"
          justify="space-between"
          align="center"
          px={{ base: 4, md: 8 }}
          py={4}
          borderBottomWidth="1px"
          borderColor="border.default"
          bg="bg.surface"
        >
          <Text fontWeight="bold" display={{ base: "block", md: "none" }}>
            SGA
          </Text>

          <HStack gap={4} ml="auto">
            {usuario && (
              <HStack gap={2}>
                <Text fontSize="sm">
                  {usuario.nombres_usuario} {usuario.apellidos_usuario}
                </Text>
                <Badge colorPalette="brand">{usuario.rol_usuario}</Badge>
              </HStack>
            )}

            <ColorModeButton />

            <Button size="sm" variant="outline" onClick={cerrarSesion}>
              Cerrar sesión
            </Button>
          </HStack>
        </Flex>

        <Box p={{ base: 4, md: 8 }}>{children}</Box>
      </Box>
    </Flex>
  );
}
