import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ProductoSelect } from "../../components/productos/ProductoSelect";
import { InputMoneda } from "../../components/inputs/InputMoneda";
import { toaster } from "../../components/ui/toaster";

import { productosApi } from "../../api/productos";
import { clientesApi } from "../../api/clientes";
import { alquileresApi } from "../../api/alquileres";
import { ApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

import type { DetalleProducto } from "../../interfaces/DetalleProducto";
import type { Cliente } from "../../interfaces/Cliente";
import type { Producto } from "../../interfaces/Producto";

import { validarAlquiler } from "../../utils/validacionesAlquiler";
import { obtenerFechaActual } from "../../components/inputs/inputFecha";
import {
  OPCIONES_UNIDAD_TIEMPO,
  convertirADias,
  unidadMinimaPermiteUnidadTiempo,
  unidadTiempoMasRestrictiva,
  type UnidadTiempo,
} from "../../utils/tiempoUi";
import { calcularPrecioConjunto } from "../../utils/precios";

// NOTA IMPORTANTE respecto al esqueleto original:
// - "clientes" se busca/crea contra el recurso dedicado /clientes (ver
//   src/api/clientes.ts), NO contra /usuarios: ese último es SOLO_ADMIN
//   en el backend y le negaría el acceso a encargado_facturacion, que sí
//   puede crear alquileres (ADMIN_O_FACTURACION). RN-CLI-01: reutilizar
//   cliente existente o registrar uno nuevo.
// - "productos" se carga desde GET /api/sga/productos.
// - id_usuario_creador NUNCA se envía: el backend lo toma del JWT.
// - tiempo_alquiler_dias (no "tiempo_alquiler"/semanas): el backend
//   guarda y calcula todo en días (ver app/utils/tiempo.py).
// - Reescrito para no depender de Chakra UI: todo son elementos HTML
//   nativos con las clases de src/styles/components.css.

export function CrearAlquiler() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  const [detallesProducto, setDetallesProducto] = useState<DetalleProducto[]>([
    { productoId: null, cantidad: 1, esExtra: false },
  ]);

  useEffect(() => {
    productosApi
      .listar()
      .then((productosCargados) => {
        setProductos(productosCargados);

        // Preselecciona el primer producto disponible en la primera fila de
        // detalle, si todavía no hay ninguno elegido (evita que la fila quede
        // con productoId: null, que el backend rechazaría al crear el alquiler).
        if (productosCargados.length > 0) {
          setDetallesProducto((actuales) =>
            actuales.map((d, i) =>
              i === 0 && d.productoId === null
                ? { ...d, productoId: productosCargados[0].id_producto }
                : d,
            ),
          );
        }
      })
      .catch((error) => {
        const mensaje =
          error instanceof ApiError
            ? error.message
            : "Error al cargar productos";

        toaster.create({
          title: "Error",
          description: mensaje,
          type: "error",
        });
      })
      .finally(() => setCargandoProductos(false));
  }, []);

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
  const [fechaInicio, setFechaInicio] = useState<string>(obtenerFechaActual());
  // Captura de la duración: el usuario elige la unidad que le resulte
  // más natural (días/semanas/meses); tiempoAlquilerDias (lo único que
  // el backend acepta) se deriva de estas dos abajo.
  const [cantidadTiempo, setCantidadTiempo] = useState<number>(1);
  const [unidadTiempo, setUnidadTiempo] = useState<UnidadTiempo>("semanas");
  const tiempoAlquilerDias = convertirADias(cantidadTiempo, unidadTiempo);
  const [deposito, setDeposito] = useState<number>(0);
  const [enviando, setEnviando] = useState(false);

  // Unidad mínima más restrictiva entre TODOS los productos ya
  // agregados al carrito (jerarquía DIA < SEMANA < MES). Determina qué
  // opciones de "Unidad de alquiler" quedan habilitadas: es solo UX
  // (previene la interacción inválida), la autoridad real es el
  // backend, que vuelve a validarlo contra la BD en crear_alquiler.
  const unidadesMinimasEnCarrito = detallesProducto
    .map((d) => productos.find((p) => p.id_producto === d.productoId)?.unidad_minima_alquiler)
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const unidadMinimaRestrictiva = unidadTiempoMasRestrictiva(unidadesMinimasEnCarrito);

  // Si el carrito cambia (se agrega/cambia un producto más restrictivo)
  // y la unidad actualmente seleccionada deja de ser válida, se
  // corrige automáticamente a la más restrictiva permitida — nunca debe
  // quedar seleccionada internamente una combinación inválida (ver
  // sección 9 del pedido: "no debe quedar seleccionada una unidad
  // incompatible después de cambiar de producto").
  useEffect(() => {
    if (!unidadMinimaPermiteUnidadTiempo(
      // Reutiliza la misma jerarquía: se compara la unidad restrictiva
      // (como si fuera la "unidad mínima") contra la unidad elegida.
      (
        { dias: "DIA", semanas: "SEMANA", meses: "MES" } as const
      )[unidadMinimaRestrictiva],
      unidadTiempo,
    )) {
      setUnidadTiempo(unidadMinimaRestrictiva);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidadMinimaRestrictiva]);

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

  const buscarClientePorDocumento = async (documento: string) => {
    if (!documento) return;

    setBuscandoCliente(true);

    try {
      const encontrado = await clientesApi.consultar(documento);

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
        const mensaje =
          error instanceof ApiError ? error.message : "Error al buscar cliente";
        toaster.create({ title: "Error", description: mensaje, type: "error" });
      }
    } finally {
      setBuscandoCliente(false);
    }
  };

  // Entrega/recogida: tarifa fija confirmada por el negocio ($15.000
  // cada una, se cobra al cliente). Es distinto del "gasto de
  // transporte" (combustible, etc.), que es un insumo interno que NO
  // se cobra al cliente y se registra aparte en el módulo Gastos como
  // evidencia — no forma parte de este cálculo.
  const TARIFA_ENTREGA_RECOGIDA = 15000;
  const costoEntrega = seLleva ? TARIFA_ENTREGA_RECOGIDA : 0;
  const costoRecogida = seRecoge ? TARIFA_ENTREGA_RECOGIDA : 0;

  // RN de precio: precio_base_producto se interpreta "por" la
  // unidad_minima_alquiler. Los productos marcados como EXTRA usan
  // precio_base_extra en su lugar (puede ser diferente, ej. precio
  // reducido para accesorios opcionales).
  const totalProductos = detallesProducto.reduce((total, detalle) => {
    const productoActual = productos.find((p) => p.id_producto === detalle.productoId);
    if (!productoActual) return total;
    const precioUsar = detalle.esExtra
      ? productoActual.precio_base_extra
      : productoActual.precio_base_producto;
    return (
      total +
      calcularPrecioConjunto(
        precioUsar,
        productoActual.unidad_minima_alquiler,
        detalle.cantidad,
        tiempoAlquilerDias,
      )
    );
  }, 0);

  // DECISIÓN DE NEGOCIO (confirmada): precio_alquiler es un campo que
  // el staff controla explícitamente — el backend YA NO lo recalcula
  // automáticamente como SUM(precio_conjunto) (antes sí lo hacía y
  // sobrescribía cualquier valor enviado; se quitó ese recálculo
  // automático justamente para permitir esto). Se sugiere un total
  // (productos + depósito + entrega/recogida) pero queda editable,
  // por ejemplo para aplicar un descuento implícito de transporte en
  // un alquiler grande.
  const precioSugerido = totalProductos + deposito + costoEntrega + costoRecogida;
  const [precioAlquiler, setPrecioAlquiler] = useState<number | null>(null);

  useEffect(() => {
    setPrecioAlquiler(precioSugerido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precioSugerido]);

  const precioAlquilerFinal = precioAlquiler ?? precioSugerido;

  const agregarProducto = () => {
    // Ya NO se limita a detallesProducto.length >= productos.length: esa
    // regla no existe en el backend. Lo único que el backend exige
    // (idx_unico_producto_alquiler) es que un mismo producto no se repita
    // como línea NO extra; sí puede repetirse si se marca "extra" (ver
    // validarAlquiler). Esa verificación ocurre al enviar el formulario.
    setDetallesProducto((actuales) => [
      ...actuales,
      { productoId: productos[0]?.id_producto ?? null, cantidad: 1, esExtra: false },
    ]);
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

    setDetallesProducto((actuales) =>
      actuales.filter((_, i) => i !== indiceAEliminar),
    );
  };

  const manejarCrearAlquiler = async () => {
    const error = validarAlquiler({
      cliente: datosCliente,
      detallesProducto,
      tiempoAlquilerDias,
      deposito,
    });

    if (error) {
      toaster.create({
        title: "Datos incompletos",
        description: error,
        type: "warning",
      });
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
      if (estadoCliente === "no-encontrado") {
        await clientesApi.crear({
          id_usuario: datosCliente.id_usuario,
          tipo_documento: datosCliente.tipo_documento,
          nombres_usuario: datosCliente.nombres_usuario,
          apellidos_usuario: datosCliente.apellidos_usuario,
          telefono_usuario: datosCliente.telefono_usuario,
        });
      }

      const alquilerCreado = await alquileresApi.crear({
        id_usuario_cliente: datosCliente.id_usuario,
        barrio,
        direccion,
        deposito,
        precio_alquiler: precioAlquilerFinal,
        fecha_inicio: fechaInicio,
        tiempo_alquiler_dias: tiempoAlquilerDias,
        se_lleva: seLleva,
        se_recoge: seRecoge,
        detalles: detallesProducto.map((d) => {
          const productoActual = productos.find(
            (p) => p.id_producto === d.productoId,
          );

          return {
            id_producto: d.productoId as number,
            cantidad_productos: d.cantidad,
            precio_conjunto: productoActual
              ? calcularPrecioConjunto(
                  productoActual.precio_base_producto,
                  productoActual.unidad_minima_alquiler,
                  d.cantidad,
                  tiempoAlquilerDias,
                )
              : 0,
            es_producto_extra: d.esExtra,
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
      // Aquí es donde, por ejemplo, se refleja "Operación denegada: El
      // usuario creador no se encuentra activo en el sistema." si el
      // backend lo rechaza (trg_validar_creador_activo), o cualquier otro
      // error de negocio (stock insuficiente, producto duplicado no
      // extra, etc.) tal como lo devuelve el backend.
      const mensaje =
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el alquiler";

      toaster.create({
        title: "Error al crear el alquiler",
        description: mensaje,
        type: "error",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="container-narrow">
      <div className="stack gap-2" style={{ marginBottom: 32 }}>
        <h1 className="heading-2xl">Crear alquiler</h1>
        <p className="text-muted">
          Registra la información necesaria para crear un nuevo alquiler.
        </p>
      </div>

      {/* Cliente */}
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Cliente
      </h2>

      <div className="card stack gap-4" style={{ marginBottom: 32 }}>
        <p className="text-bold">Datos del cliente</p>

        {estadoCliente === "encontrado" && (
          <p className="text-sm text-success">
            ✓ Cliente encontrado (ya registrado).
          </p>
        )}
        {estadoCliente === "no-encontrado" && (
          <p className="text-sm text-warning">
            Cliente no encontrado — se registrará como nuevo al crear el
            alquiler.
          </p>
        )}

        <div className="grid grid-cols-1 grid-cols-2-md">
          <div>
            <label className="field-label">Tipo de documento</label>
            <select
              className="input"
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
          </div>

          <div>
            <label className="field-label">Número de documento</label>
            <input
              className="input"
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
              placeholder={
                buscandoCliente ? "Buscando..." : "Número de documento"
              }
            />
          </div>

          <div>
            <label className="field-label">Nombres</label>
            <input
              ref={nombresRef}
              className="input"
              value={datosCliente.nombres_usuario}
              placeholder="Nombres del cliente"
              onChange={(e) =>
                setDatosCliente((actuales) => ({
                  ...actuales,
                  nombres_usuario: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  apellidosRef.current?.focus();
                }
              }}
            />
          </div>

          <div>
            <label className="field-label">Apellidos</label>
            <input
              ref={apellidosRef}
              className="input"
              value={datosCliente.apellidos_usuario}
              placeholder="Apellidos del cliente"
              onChange={(e) =>
                setDatosCliente((actuales) => ({
                  ...actuales,
                  apellidos_usuario: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  telefonoRef.current?.focus();
                }
              }}
            />
          </div>

          <div>
            <label className="field-label">Teléfono</label>
            <input
              maxLength={10}
              ref={telefonoRef}
              className="input"
              value={datosCliente.telefono_usuario}
              placeholder="Teléfono del cliente"
              onChange={(e) =>
                setDatosCliente((actuales) => ({
                  ...actuales,
                  telefono_usuario: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  direccionRef.current?.focus();
                }
              }}
            />
          </div>
        </div>
      </div>
      {/* Alquiler */}
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Alquiler
      </h2>
      <div className="card stack gap-4" style={{ marginBottom: 32 }}>
        <div>
          <label className="field-label">Dirección</label>
          <input
            ref={direccionRef}
            className="input"
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
        </div>

        <div>
          <label className="field-label">Barrio</label>
          <input
            ref={barrioRef}
            className="input"
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
        </div>

        <div className="grid grid-cols-1 grid-cols-2-md">
          <div>
            <label className="field-label">Fecha de inicio</label>
            <input
              className="input"
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
          </div>

          <div>
            <label className="field-label">Tiempo de alquiler</label>
            <div className="hstack gap-2">
              <input
                ref={tiempoAlquilerRef}
                className="input"
                type="number"
                min={1}
                placeholder="Cantidad"
                onFocus={(e) => e.target.select()}
                value={cantidadTiempo}
                onChange={(e) => setCantidadTiempo(parseInt(e.target.value) || 1)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    depositoRef.current?.focus();
                  }
                }}
              />

              <select
                className="input"
                style={{ maxWidth: 130 }}
                value={unidadTiempo}
                onChange={(e) => setUnidadTiempo(e.target.value as UnidadTiempo)}
              >
                {OPCIONES_UNIDAD_TIEMPO.map((opcion) => {
                  const deshabilitada = !unidadMinimaPermiteUnidadTiempo(
                    ({ dias: "DIA", semanas: "SEMANA", meses: "MES" } as const)[
                      unidadMinimaRestrictiva
                    ],
                    opcion.valor,
                  );

                  return (
                    <option key={opcion.valor} value={opcion.valor} disabled={deshabilitada}>
                      {opcion.etiqueta}
                      {deshabilitada ? " (no disponible)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <p className="text-sm text-muted" style={{ marginTop: 4 }}>
              Equivale a {tiempoAlquilerDias} día(s). El backend siempre guarda la
              duración en días.
            </p>

            {unidadMinimaRestrictiva !== "dias" && (
              <p className="text-sm text-warning" style={{ marginTop: 4 }}>
                Uno o más productos de este alquiler solo pueden alquilarse por{" "}
                {unidadMinimaRestrictiva === "semanas" ? "semana o mes" : "mes"}.
              </p>
            )}

            <div style={{ marginTop: 16 }}>
              <label className="field-label">Depósito</label>
              <InputMoneda
                ref={depositoRef}
                value={deposito}
                onChange={setDeposito}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logística */}
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Logística
      </h2>
      <div className="hstack gap-8" style={{ marginBottom: 32 }}>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={seLleva}
            onChange={(e) => setSeLleva(e.target.checked)}
          />
          Se lleva
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={seRecoge}
            onChange={(e) => setSeRecoge(e.target.checked)}
          />
          Se recoge
        </label>
      </div>

      {/* Productos */}
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Productos
      </h2>

      {cargandoProductos && <p className="text-muted">Cargando productos...</p>}

      <div className="stack gap-4" style={{ marginBottom: 32 }}>
        {detallesProducto.map((detalle, indice) => {
          const productoActual = productos.find(
            (p) => p.id_producto === detalle.productoId,
          );
          const precioConjunto = productoActual
            ? calcularPrecioConjunto(
                productoActual.precio_base_producto,
                productoActual.unidad_minima_alquiler,
                detalle.cantidad,
                tiempoAlquilerDias,
              )
            : 0;

          return (
            <div key={indice} className="card">
              <div className="grid grid-cols-1 grid-cols-3-md">
                <div>
                  <label className="field-label">Producto</label>
                  <ProductoSelect
                    productos={productos}
                    value={detalle.productoId}
                    onProductoChange={(idProducto) => {
                      setDetallesProducto((actuales) =>
                        actuales.map((d, i) =>
                          i === indice ? { ...d, productoId: idProducto } : d,
                        ),
                      );
                    }}
                  />
                  {productoActual && (
                    <p className="text-sm text-muted" style={{ marginTop: 4 }}>
                      ${productoActual.precio_base_producto.toLocaleString("es-CO")} /{" "}
                      {{ DIA: "día", SEMANA: "semana", MES: "mes" }[
                        productoActual.unidad_minima_alquiler
                      ]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="field-label">Cantidad</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={detalle.cantidad}
                    onChange={(e) => {
                      const cantidad = Number(e.target.value);
                      setDetallesProducto((actuales) =>
                        actuales.map((d, i) =>
                          i === indice ? { ...d, cantidad } : d,
                        ),
                      );
                    }}
                  />
                </div>

                <div>
                  <label className="field-label">Precio conjunto</label>
                  <input
                    className="input"
                    value={`$${precioConjunto.toLocaleString("es-CO")}`}
                    readOnly
                  />
                </div>
              </div>

              <label className="checkbox-row" style={{ marginTop: 16 }}>
                <input
                  type="checkbox"
                  checked={detalle.esExtra}
                  onChange={(e) => {
                    const esExtra = e.target.checked;
                    setDetallesProducto((actuales) =>
                      actuales.map((d, i) =>
                        i === indice ? { ...d, esExtra } : d,
                      ),
                    );
                  }}
                />
                Producto extra (permite repetir el mismo producto en otra línea)
              </label>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ marginTop: 16 }}
                onClick={() => eliminarProducto(indice)}
              >
                Eliminar producto
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="btn btn-outline"
          style={{ alignSelf: "flex-start" }}
          onClick={agregarProducto}
        >
          + Agregar producto
        </button>
      </div>

      {/* Resumen */}
      <h2 className="heading-lg" style={{ marginBottom: 16 }}>
        Resumen del alquiler
      </h2>

      <div className="card stack gap-3" style={{ marginBottom: 32 }}>
        <div className="hstack justify-between">
          <span>Productos</span>
          <span>${totalProductos.toLocaleString("es-CO")}</span>
        </div>

        <ul className="stack gap-1" style={{ marginTop: -4, marginBottom: 4, paddingLeft: 20 }}>
          {detallesProducto.map((detalle, indice) => {
            const productoActual = productos.find((p) => p.id_producto === detalle.productoId);
            if (!productoActual) return null;

            const precioUsar = detalle.esExtra
              ? productoActual.precio_base_extra
              : productoActual.precio_base_producto;

            const precioConjunto = calcularPrecioConjunto(
              precioUsar,
              productoActual.unidad_minima_alquiler,
              detalle.cantidad,
              tiempoAlquilerDias,
            );

            return (
              <li key={indice} className="hstack justify-between text-sm text-muted">
                <span>
                  {detalle.esExtra ? "Extra: " : ""}
                  {productoActual.nombre_producto} ({detalle.cantidad})
                </span>
                <span>${precioConjunto.toLocaleString("es-CO")}</span>
              </li>
            );
          })}
        </ul>

        <div className="hstack justify-between">
          <span>Entrega</span>
          <span>${costoEntrega.toLocaleString("es-CO")}</span>
        </div>
        <div className="hstack justify-between">
          <span>Recogida</span>
          <span>${costoRecogida.toLocaleString("es-CO")}</span>
        </div>
        <div className="hstack justify-between">
          <span>Depósito</span>
          <span>${deposito.toLocaleString("es-CO")}</span>
        </div>
        <div className="hstack justify-between text-bold">
          <span>Precio calculado</span>
          <span>${precioSugerido.toLocaleString("es-CO")}</span>
        </div>

        <div style={{ paddingTop: 12 }}>
          <label className="field-label">Precio final del alquiler</label>
          <InputMoneda
            value={precioAlquilerFinal}
            onChange={(nuevoPrecio) => setPrecioAlquiler(nuevoPrecio)}
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="hstack justify-end gap-3">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate("/alquileres")}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="btn btn-primary"
          disabled={enviando}
          onClick={manejarCrearAlquiler}
        >
          {enviando ? "Creando..." : "Crear alquiler"}
        </button>
      </div>
    </div>
  );
}
