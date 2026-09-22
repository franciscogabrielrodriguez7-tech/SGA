import type { RefObject } from "react";
import type { Cliente } from "../../interfaces/Cliente";

interface ClienteSectionProps {
  datosCliente: Cliente;
  setDatosCliente: React.Dispatch<React.SetStateAction<Cliente>>;
  estadoCliente: "sin-verificar" | "encontrado" | "no-encontrado";
  buscandoCliente: boolean;
  buscarClientePorDocumento: (documento: string) => void;

  nombresRef: RefObject<HTMLInputElement | null>;
  apellidosRef: RefObject<HTMLInputElement | null>;
  telefonoRef: RefObject<HTMLInputElement | null>;
  direccionRef: RefObject<HTMLInputElement | null>;
}

export function ClienteSection({
  datosCliente,
  setDatosCliente,
  estadoCliente,
  buscandoCliente,
  buscarClientePorDocumento,
  nombresRef,
  apellidosRef,
  telefonoRef,
  direccionRef,
}: ClienteSectionProps) {
  return (
    <>
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
                  tipo_documento:
                    e.target.value as Cliente["tipo_documento"],
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

              }}
              onBlur={() =>
                buscarClientePorDocumento(datosCliente.id_usuario)
              }
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
    </>
  );
}