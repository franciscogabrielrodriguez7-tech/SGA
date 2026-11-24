import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { transformWithOxc } from "vite";
import React from "react";
import ReactDOMServer from "react-dom/server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reactUrl = import.meta.resolve("react");

// Cargar y transformar dinámicamente un componente TSX real usando el compilador Vite (Oxc)
// con archivo temporal fuera del repositorio (en os.tmpdir()) y limpieza garantizada en bloque finally.
async function cargarComponenteDinamico(rutaRelativa, exportName, reemplazoImport = null) {
  const rutaComponente = path.resolve(__dirname, rutaRelativa);
  const codigoTsx = fs.readFileSync(rutaComponente, "utf-8");

  const resultado = await transformWithOxc(codigoTsx, rutaComponente, {
    lang: "tsx",
    jsx: { runtime: "classic", pragma: "React.createElement", pragmaFrag: "React.Fragment" },
  });

  let codigoFinal = resultado.code;
  if (reemplazoImport) {
    codigoFinal = codigoFinal.replace(reemplazoImport.buscar, reemplazoImport.reemplazar);
  }

  const moduloCompleto = `import React from "${reactUrl}";\n${codigoFinal}`;
  const tmpFile = path.join(os.tmpdir(), `sga_${exportName}_${crypto.randomUUID()}.mjs`);

  try {
    fs.writeFileSync(tmpFile, moduloCompleto, "utf-8");
    const moduloImportado = await import(`file:///${tmpFile.replace(/\\/g, "/")}`);
    return moduloImportado[exportName];
  } finally {
    try {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    } catch {
      // Ignorar si el sistema operativo retiene brevemente el descriptor
    }
  }
}

async function cargarComponenteCambiarEstado() {
  const rutaInterfaces = path.resolve(__dirname, "../src/interfaces/Alquiler.ts").replace(/\\/g, "/");
  return cargarComponenteDinamico(
    "../src/components/alquilerDetalleComponents/CambiarEstadoSection.tsx",
    "CambiarEstadoSection",
    {
      buscar: 'from "../../interfaces/Alquiler"',
      reemplazar: `from "file:///${rutaInterfaces}"`,
    }
  );
}

async function cargarComponenteLogistica() {
  return cargarComponenteDinamico(
    "../src/components/alquilerDetalleComponents/LogisticaSection.tsx",
    "LogisticaSection"
  );
}

test("Pruebas de renderizado real de CambiarEstadoSection y LogisticaSection", async (t) => {
  const CambiarEstadoSection = await cargarComponenteCambiarEstado();
  const LogisticaSection = await cargarComponenteLogistica();

  await t.test("Con puedeGestionarFacturacion = true: renderiza selector de estado, botón Aplicar y botón Cancelar alquiler", () => {
    let estadoSeleccionado = "";
    let cambioAplicado = false;
    let cancelacionEjecutada = false;

    const elemento = React.createElement(CambiarEstadoSection, {
      nuevoEstado: estadoSeleccionado,
      setNuevoEstado: (e) => { estadoSeleccionado = e; },
      manejarCambioEstado: () => { cambioAplicado = true; },
      puedeGestionarFacturacion: true,
      manejarCancelar: () => { cancelacionEjecutada = true; },
    });

    const html = ReactDOMServer.renderToString(elemento);

    // Verificación de controles administrativos de facturación visibles
    assert.ok(html.includes("<select"), "Debe renderizar la etiqueta <select> para elegir estado");
    assert.ok(html.includes("Selecciona un estado"), "Debe incluir la opción inicial del selector");
    assert.ok(html.includes("Aplicar"), "Debe renderizar el botón de acción 'Aplicar'");
    assert.ok(html.includes("Cancelar alquiler"), "Debe renderizar el botón 'Cancelar alquiler'");

    // Verificación de ausencia del mensaje de restricción
    assert.ok(
      !html.includes("Solo el personal de administración o facturación tiene permisos"),
      "No debe mostrar el mensaje de restricción a usuarios con permisos de facturación"
    );
  });

  await t.test("Con puedeGestionarFacturacion = false: oculta selector y botones, y muestra mensaje informativo de restricción", () => {
    const elemento = React.createElement(CambiarEstadoSection, {
      nuevoEstado: "",
      setNuevoEstado: () => {},
      manejarCambioEstado: () => {},
      puedeGestionarFacturacion: false,
      manejarCancelar: () => {},
    });

    const html = ReactDOMServer.renderToString(elemento);

    // Verificación de controles administrativos de facturación ocultos
    assert.ok(!html.includes("<select"), "NO debe renderizar el <select> de cambio de estado");
    assert.ok(!html.includes(">Aplicar<"), "NO debe renderizar el botón 'Aplicar'");
    assert.ok(!html.includes("Cancelar alquiler"), "NO debe renderizar el botón 'Cancelar alquiler'");

    // Verificación del mensaje informativo para personal sin permisos (ej. logístico)
    assert.ok(
      html.includes("Solo el personal de administración o facturación tiene permisos para cambiar manualmente el estado del alquiler o cancelarlo"),
      "Debe renderizar el mensaje explicativo de restricción de permisos"
    );
  });

  await t.test("Garantía de artefactos efímeros (Obs 4.1): el árbol de trabajo no retiene archivos compilados residuales", () => {
    const tmpEnRepo = path.resolve(__dirname, "../node_modules/.tmp/CambiarEstadoSection.compiled.mjs");
    assert.ok(!fs.existsSync(tmpEnRepo), "No deben dejarse archivos .compiled.mjs dentro de node_modules/.tmp");
  });

  await t.test("Renderizado SSR de LogisticaSection (Obs 4.2 - estado vacío): renderiza secciones y botones sin bloqueo", () => {
    let entregaRegistrada = false;
    let recogidaRegistrada = false;

    const elemento = React.createElement(LogisticaSection, {
      entregas: [],
      recogidas: [],
      observacionesEntrega: "",
      setObservacionesEntrega: () => {},
      manejarRegistrarEntrega: () => { entregaRegistrada = true; },
      observacionesRecogida: "",
      setObservacionesRecogida: () => {},
      manejarRegistrarRecogida: () => { recogidaRegistrada = true; },
    });

    const html = ReactDOMServer.renderToString(elemento);

    assert.ok(html.includes("Entregas"), "Debe mostrar el encabezado de Entregas");
    assert.ok(html.includes("Aún no hay entregas registradas."), "Debe mostrar mensaje de entregas vacías");
    assert.ok(html.includes("Registrar entrega"), "Debe renderizar el botón para registrar entrega");

    assert.ok(html.includes("Recogidas"), "Debe mostrar el encabezado de Recogidas");
    assert.ok(html.includes("Aún no hay recogidas registradas."), "Debe mostrar mensaje de recogidas vacías");
    assert.ok(html.includes("Registrar recogida"), "Debe renderizar el botón para registrar recogida");
  });

  await t.test("Renderizado SSR de LogisticaSection (Obs 4.2 - con datos): renderiza tarjetas de entrega y recogida con datos de logístico", () => {
    const entregasMock = [
      {
        id_logistica_alquiler: 101,
        fecha_gasto: "2026-11-20",
        nombres_logistico: "Carlos Logístico",
        observaciones_logistica_alquiler: "Entrega inicial en obra central",
      },
    ];

    const recogidasMock = [
      {
        id_logistica_alquiler: 202,
        fecha_gasto: "2026-11-23",
        nombres_logistico: "Ana Logística",
        observaciones_logistica_alquiler: "Recogida de puntales metálicos",
      },
    ];

    const elemento = React.createElement(LogisticaSection, {
      entregas: entregasMock,
      recogidas: recogidasMock,
      observacionesEntrega: "",
      setObservacionesEntrega: () => {},
      manejarRegistrarEntrega: () => {},
      observacionesRecogida: "",
      setObservacionesRecogida: () => {},
      manejarRegistrarRecogida: () => {},
    });

    const html = ReactDOMServer.renderToString(elemento);

    // Comprobar que los datos de entrega se muestran (React SSR inserta comentarios entre expresiones adyacentes)
    assert.ok(html.includes("Carlos Logístico"), "Debe renderizar el nombre del logístico de la entrega");
    assert.ok(html.includes("2026-11-20"), "Debe renderizar la fecha de la entrega");
    assert.ok(html.includes("Entrega inicial en obra central"), "Debe renderizar las observaciones de entrega");

    // Comprobar que los datos de recogida se muestran
    assert.ok(html.includes("Ana Logística"), "Debe renderizar el nombre del logístico de la recogida");
    assert.ok(html.includes("2026-11-23"), "Debe renderizar la fecha de la recogida");
    assert.ok(html.includes("Recogida de puntales metálicos"), "Debe renderizar las observaciones de recogida");

    // Comprobar presencia de los botones operativos
    assert.ok(html.includes("Registrar entrega"), "El botón de registrar entrega debe estar disponible");
    assert.ok(html.includes("Registrar recogida"), "El botón de registrar recogida debe estar disponible");
  });

  await t.test("Independencia funcional de LogisticaSection: no depende de puedeGestionarFacturacion", () => {
    const rutaLogistica = path.resolve(__dirname, "../src/components/alquilerDetalleComponents/LogisticaSection.tsx");
    assert.ok(fs.existsSync(rutaLogistica), "El componente LogisticaSection existe como módulo independiente");

    const codigoLogistica = fs.readFileSync(rutaLogistica, "utf-8");
    assert.ok(
      !codigoLogistica.includes("puedeGestionarFacturacion"),
      "LogisticaSection gestiona entregas y recogidas sin quedar bloqueado por permisos de facturación"
    );
  });
});
