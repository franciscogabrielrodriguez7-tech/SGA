import {
  Box,
  Button,
  Checkbox,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ProductoSelect } from "../../components/productos/ProductoSelect";
import { InputMoneda } from "../../components/inputs/InputMoneda";
import { toaster } from "../../components/ui/toaster";

import { productosApi } from "../../api/productos";
import { usuariosApi } from "../../api/usuarios";
import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

import type { DetalleProducto } from "../../interfaces/DetalleProducto";
import type { PrecioFinal } from "../../interfaces/PrecioFinal";
import type { Cliente } from "../../interfaces/Cliente";
import type { Producto } from "../../interfaces/Producto";

import { validarAlquiler } from "../../utils/validacionesAlquiler";

// NOTA IMPORTANTE respecto al esqueleto original:
// - "clientes" ya NO se recibe como prop con datos mock: se busca en vivo
//   contra GET /api/sga/usuarios/{id_usuario} (RN-CLI-01: reutilizar
//   cliente existente o registrar uno nuevo).
// - "productos" ya NO es el arreglo estático de src/data/productos.ts:
//   se carga desde GET /api/sga/productos.
// - El precio "calculado" localmente (informativo) y el "precio final"
//   editable se envían ambos como alquiler.precio_alquiler? No: el
//   backend solo tiene UN campo precio_alquiler (ver AlquilerCreatePayload).
//   Se envía el precioFinal.valor (el que el usuario puede ajustar
//   manualmente), consistente con "el encargado ajusta el precio final".

export function CrearAlquiler() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  useEffect(() => {
    productosApi
      .listar()
      .then(setProductos)
      .catch((error) => {
        const mensaje =
          error instanceof ApiError ? error.message : "Error al cargar productos";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      })
      .finally(() => setCargandoProductos(false));
  }, []);

  const [detallesProducto, setDetallesProducto] = useState<DetalleProducto[]>([
    { productoId: null, cantidad: 1 },
  ]);

  const tipoDocumentoRef = useRef<HTMLSelectElement>(null);
  const nombresRef = useRef<HTMLInputElement>(null);
  const apellidosRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const direccionRef = useRef<HTMLInputElement>(null);
  const barrioRef = useRef<HTMLInputElement>(null);
  const fechaInicioRef = useRef<HTMLInputElement>(null);
  const tiempoAlquilerRef = useRef<HTMLInputElement>(null);
  const depositoRef = useRef<HTMLInputElement>(null);

  const [seLleva, setSeLleva] = useState<boolean>(false);
  const [seRecoge, setSeRecoge] = useState<boolean>(false);
  const [direccion, setDireccion] = useState("");
  const [barrio, setBarrio] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [tiempoAlquiler, setTiempoAlquiler] = useState<number>(1);
  const [deposito, setDeposito] = useState<number>(0);
  const [enviando, setEnviando] = useState(false);

  const [precioFinal, setPrecioFinal] = useState<PrecioFinal>({ valor: 0 });

  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [datosCliente, setDatosCliente] = useState<Cliente>({
    id_usuario: "",
    tipo_documento: "CC",
    nombres_usuario: "",
    apellidos_usuario: "",
    telefono_usuario: "",
  });
  const [estadoCliente, setEstadoCliente] = useState<
    "sin-verificar" | "encontrado" | "no-encontrado"
  >("sin-verificar");

  // RN-CLI-01: verifica si el cliente ya existe en GET /usuarios/{id}. Si
  // no existe, se registrará como nuevo al crear el alquiler (ver
  // manejarCrearAlquiler).
  const buscarClientePorDocumento = async (documento: string) => {
    if (!documento) return;

    setBuscandoCliente(true);

    try {
      const encontrado = await usuariosApi.consultar(documento);

      setDatosCliente({
        id_usuario: encontrado.id_usuario,
        tipo_documento: encontrado.tipo_documento,
        nombres_usuario: encontrado.nombres_usuario,
        apellidos_usuario: encontrado.apellidos_usuario,
        telefono_usuario: encontrado.telefono_usuario,
      });
      setEstadoCliente("encontrado");
    } catch (error) {
      if (error instanceof ApiError && error.code === 404) {
        setEstadoCliente("no-encontrado");
        setDatosCliente((actuales) => ({
          ...actuales,
          id_usuario: documento,
          nombres_usuario: "",
          apellidos_usuario: "",
          telefono_usuario: "",
        }));
      } else {
        const mensaje = error instanceof ApiError ? error.message : "Error al buscar cliente";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      }
    } finally {
      setBuscandoCliente(false);
    }
  };

  const costoEntrega = seLleva ? 15000 : 0;
  const costoRecogida = seRecoge ? 15000 : 0;

  const totalProductos = detallesProducto.reduce((total, detalle) => {
    const productoActual = productos.find((p) => p.id_producto === detalle.productoId);
    const precioConjunto = productoActual
      ? productoActual.precio_base_producto * detalle.cantidad
      : 0;
    return total + precioConjunto;
  }, 0);

  const precioCalculado =
    totalProductos * tiempoAlquiler + costoEntrega + costoRecogida + deposito;

  useEffect(() => {
    setPrecioFinal({ valor: precioCalculado });
  }, [precioCalculado]);

  const agregarProducto = () => {
    if (detallesProducto.length >= productos.length) {
      toaster.create({
        title: "No se pueden agregar más productos",
        description: "Todos los productos disponibles ya han sido seleccionados.",
        type: "warning",
      });
      return;
    }

    setDetallesProducto((actuales) => [...actuales, { productoId: null, cantidad: 1 }]);
  };

  const eliminarProducto = (indiceAEliminar: number) => {
    if (detallesProducto.length === 1) {
      toaster.create({
        title: "No permitido",
        description: "Debe haber al menos un producto en el alquiler.",
        type: "warning",
      });
      return;
    }

    setDetallesProducto((actuales) => actuales.filter((_, i) => i !== indiceAEliminar));
  };

  const manejarCrearAlquiler = async () => {
    const error = validarAlquiler({
      cliente: datosCliente,
      detallesProducto,
      tiempoAlquiler,
      deposito,
    });

    if (error) {
      toaster.create({ title: "Datos incompletos", description: error, type: "warning" });
      return;
    }

    if (!fechaInicio) {
      toaster.create({
        title: "Datos incompletos",
        description: "Debe indicar la fecha de inicio.",
        type: "warning",
      });
      return;
    }

    if (!usuario) {
      toaster.create({
        title: "Sesión requerida",
        description: "Debes iniciar sesión para crear un alquiler.",
        type: "error",
      });
      return;
    }

    setEnviando(true);

    try {
      // RN-CLI-01: si el cliente no existía, se registra aquí antes de
      // crear el alquiler (mismo flujo de negocio, solo que en dos
      // llamadas en vez de una, porque el backend no crea usuarios de
      // forma implícita dentro de POST /alquileres).
      if (estadoCliente === "no-encontrado") {
        await usuariosApi.crear({
          id_usuario: datosCliente.id_usuario,
          rol_usuario: "cliente",
          tipo_documento: datosCliente.tipo_documento,
          nombres_usuario: datosCliente.nombres_usuario,
          apellidos_usuario: datosCliente.apellidos_usuario,
          telefono_usuario: datosCliente.telefono_usuario,
        });
      }

      const alquilerCreado = await alquileresApi.crear({
        id_usuario_creador: usuario.id_usuario,
        id_usuario_cliente: datosCliente.id_usuario,
        barrio,
        direccion,
        deposito,
        precio_alquiler: precioFinal.valor,
        fecha_inicio: fechaInicio,
        tiempo_alquiler: tiempoAlquiler,
        se_lleva: seLleva,
        se_recoge: seRecoge,
        detalles: detallesProducto.map((d) => {
          const productoActual = productos.find((p) => p.id_producto === d.productoId);
          const precioConjunto = productoActual
            ? productoActual.precio_base_producto * d.cantidad
            : 0;

          return {
            id_producto: d.productoId as number,
            cantidad_productos: d.cantidad,
            precio_conjunto: precioConjunto,
          };
        }),
      });

      toaster.create({
        title: "Alquiler creado",
        description: `Alquiler #${alquilerCreado.id_alquiler} creado correctamente.`,
        type: "success",
      });

      navigate(`/alquileres/${alquilerCreado.id_alquiler}`);
    } catch (error) {
      // Aquí se reflejan, tal cual, los mensajes del backend: stock
      // insuficiente (RN-INV-05/06), fecha de inicio inválida, etc.
      const mensaje =
        error instanceof ApiError ? error.message : "No se pudo crear el alquiler";

      toaster.create({ title: "Error al crear el alquiler", description: mensaje, type: "error" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Box maxW="1000px" mx="auto">
      <Stack gap={2} mb={8}>
        <Heading size="2xl">Crear alquiler</Heading>
        <Text color="fg.muted">
          Registra la información necesaria para crear un nuevo alquiler.
        </Text>
      </Stack>

      {/* Cliente */}
      <Box mb={8}>
        <Heading size="lg" mb={4}>
          Cliente
        </Heading>
      </Box>

      <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={4} mb={8}>
        <Stack gap={4}>
          <Text fontWeight="bold">Datos del cliente</Text>

          {estadoCliente === "encontrado" && (
            <Text fontSize="sm" color="green.500">
              ✓ Cliente encontrado (ya registrado).
            </Text>
          )}
          {estadoCliente === "no-encontrado" && (
            <Text fontSize="sm" color="orange.500">
              Cliente no encontrado — se registrará como nuevo al crear el alquiler.
            </Text>
          )}

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Box>
              <Text mb={2} fontWeight="medium">Tipo de documento</Text>
              <select
                ref={tipoDocumentoRef}
                value={datosCliente.tipo_documento}
                onChange={(e) =>
                  setDatosCliente((actuales) => ({
                    ...actuales,
                    tipo_documento: e.target.value as Cliente["tipo_documento"],
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    nombresRef.current?.focus();
                  }
                }}
              >
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="NIT">NIT</option>
                <option value="PPT">PPT</option>
              </select>
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">Número de documento</Text>
              <Input
                value={datosCliente.id_usuario}
                onChange={(e) => {
                  const documento = e.target.value;
                  setDatosCliente({
                    id_usuario: documento,
                    tipo_documento: "CC",
                    nombres_usuario: "",
                    apellidos_usuario: "",
                    telefono_usuario: "",
                  });
                  setEstadoCliente("sin-verificar");
                }}
                onBlur={() => buscarClientePorDocumento(datosCliente.id_usuario)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    buscarClientePorDocumento(datosCliente.id_usuario);
                  }
                }}
                placeholder={buscandoCliente ? "Buscando..." : "Número de documento"}
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">Nombres</Text>
              <Input
                ref={nombresRef}
                value={datosCliente.nombres_usuario}
                placeholder="Nombres del cliente"
                onChange={(e) =>
                  setDatosCliente((actuales) => ({ ...actuales, nombres_usuario: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    apellidosRef.current?.focus();
                  }
                }}
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">Apellidos</Text>
              <Input
                ref={apellidosRef}
                value={datosCliente.apellidos_usuario}
                placeholder="Apellidos del cliente"
                onChange={(e) =>
                  setDatosCliente((actuales) => ({ ...actuales, apellidos_usuario: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    telefonoRef.current?.focus();
                  }
                }}
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">Teléfono</Text>
              <Input
                ref={telefonoRef}
                value={datosCliente.telefono_usuario}
                placeholder="Teléfono del cliente"
                onChange={(e) =>
                  setDatosCliente((actuales) => ({ ...actuales, telefono_usuario: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    direccionRef.current?.focus();
                  }
                }}
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">Dirección</Text>
              <Input
                ref={direccionRef}
                placeholder="Dirección"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    barrioRef.current?.focus();
                  }
                }}
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">Barrio</Text>
              <Input
                ref={barrioRef}
                placeholder="Barrio"
                value={barrio}
                onChange={(e) => setBarrio(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    fechaInicioRef.current?.focus();
                  }
                }}
              />
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Box>
              <Text mb={2} fontWeight="medium">Fecha de inicio</Text>
              <Input
                type="date"
                ref={fechaInicioRef}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    tiempoAlquilerRef.current?.focus();
                  }
                }}
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">Tiempo de alquiler (en semanas)</Text>
              <Input
                ref={tiempoAlquilerRef}
                type="number"
                min={1}
                placeholder="Cantidad de semanas"
                onFocus={(e) => e.target.select()}
                value={tiempoAlquiler}
                onChange={(e) => setTiempoAlquiler(parseInt(e.target.value) || 1)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    depositoRef.current?.focus();
                  }
                }}
              />

              <Box mt={4}>
                <Text mb={2} fontWeight="medium">Depósito</Text>
                <InputMoneda ref={depositoRef} value={deposito} onChange={setDeposito} />
              </Box>
            </Box>
          </SimpleGrid>
        </Stack>
      </Box>

      {/* Logística */}
      <Box mb={8}>
        <Heading size="lg" mb={4}>Logística</Heading>
        <HStack gap={8}>
          <Checkbox.Root checked={seLleva} onCheckedChange={(c) => setSeLleva(Boolean(c.checked))}>
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Se lleva</Checkbox.Label>
          </Checkbox.Root>

          <Checkbox.Root checked={seRecoge} onCheckedChange={(c) => setSeRecoge(Boolean(c.checked))}>
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Se recoge</Checkbox.Label>
          </Checkbox.Root>
        </HStack>
      </Box>

      {/* Productos */}
      <Box mb={8}>
        <Heading size="lg" mb={4}>Productos</Heading>

        {cargandoProductos && <Text color="fg.muted">Cargando productos...</Text>}

        <Stack gap={4}>
          {detallesProducto.map((detalle, indice) => {
            const productoActual = productos.find((p) => p.id_producto === detalle.productoId);
            const precioConjunto = productoActual
              ? productoActual.precio_base_producto * detalle.cantidad
              : 0;

            return (
              <Box key={indice} borderWidth="1px" borderColor="border.default" borderRadius="md" p={4}>
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                  <Box>
                    <Text mb={2} fontWeight="medium">Producto</Text>
                    <ProductoSelect
                      productos={productos}
                      value={detalle.productoId}
                      onProductoChange={(idProducto) => {
                        setDetallesProducto((actuales) =>
                          actuales.map((d, i) => (i === indice ? { ...d, productoId: idProducto } : d)),
                        );
                      }}
                    />
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="medium">Cantidad</Text>
                    <Input
                      type="number"
                      min={1}
                      value={detalle.cantidad}
                      onChange={(e) => {
                        const cantidad = Number(e.target.value);
                        setDetallesProducto((actuales) =>
                          actuales.map((d, i) => (i === indice ? { ...d, cantidad } : d)),
                        );
                      }}
                    />
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="medium">Precio conjunto</Text>
                    <Input value={`$${precioConjunto.toLocaleString("es-CO")}`} readOnly />
                  </Box>

                  <Button alignSelf="flex-start" variant="outline" onClick={() => eliminarProducto(indice)}>
                    Eliminar producto
                  </Button>
                </SimpleGrid>
              </Box>
            );
          })}

          <Button alignSelf="flex-start" variant="outline" onClick={agregarProducto}>
            + Agregar producto
          </Button>
        </Stack>
      </Box>

      {/* Resumen */}
      <Box mb={8}>
        <Heading size="lg" mb={4}>Resumen del alquiler</Heading>

        <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={5}>
          <Stack gap={3}>
            <HStack justify="space-between">
              <Text>Productos</Text>
              <Text>${totalProductos.toLocaleString("es-CO")}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Entrega</Text>
              <Text>${costoEntrega.toLocaleString("es-CO")}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Recogida</Text>
              <Text>${costoRecogida.toLocaleString("es-CO")}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Depósito</Text>
              <Text>${deposito.toLocaleString("es-CO")}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontWeight="bold">Precio calculado</Text>
              <Text fontWeight="bold">${precioCalculado.toLocaleString("es-CO")}</Text>
            </HStack>

            <Box pt={3}>
              <Text mb={2} fontWeight="medium">Precio final del alquiler</Text>
              <InputMoneda
                value={precioFinal.valor}
                onChange={(nuevoPrecio) => setPrecioFinal({ valor: nuevoPrecio })}
              />
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Acciones */}
      <HStack justify="flex-end" gap={3}>
        <Button variant="outline" onClick={() => navigate("/alquileres")}>
          Cancelar
        </Button>

        <Button onClick={manejarCrearAlquiler} loading={enviando} colorPalette="brand">
          Crear alquiler
        </Button>
      </HStack>
    </Box>
  );
}
