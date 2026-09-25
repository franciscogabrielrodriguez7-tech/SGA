import type { Dispatch, RefObject, SetStateAction } from "react";

import { InputMoneda } from "../inputs/InputMoneda";

import {
  OPCIONES_UNIDAD_TIEMPO,
  unidadMinimaPermiteUnidadTiempo,
  type UnidadTiempo,
} from "../../utils/tiempoUi";

interface AlquilerSectionProps {
  direccion: string;
  setDireccion: Dispatch<SetStateAction<string>>;

  barrio: string;
  setBarrio: Dispatch<SetStateAction<string>>;

  fechaInicio: string;
  setFechaInicio: Dispatch<SetStateAction<string>>;

  cantidadTiempo: number;
  setCantidadTiempo: Dispatch<SetStateAction<number>>;

  unidadTiempo: UnidadTiempo;
  setUnidadTiempo: Dispatch<SetStateAction<UnidadTiempo>>;

  deposito: number;
  setDeposito: Dispatch<SetStateAction<number>>;

  tiempoAlquilerDias: number;
  unidadMinimaRestrictiva: UnidadTiempo;

  direccionRef: RefObject<HTMLInputElement | null>;
  barrioRef: RefObject<HTMLInputElement | null>;
  fechaInicioRef: RefObject<HTMLInputElement | null>;
  tiempoAlquilerRef: RefObject<HTMLInputElement | null>;
  depositoRef: RefObject<HTMLInputElement | null>;
}

export function AlquilerSection({
  direccion,
  setDireccion,
  barrio,
  setBarrio,
  fechaInicio,
  setFechaInicio,
  cantidadTiempo,
  setCantidadTiempo,
  unidadTiempo,
  setUnidadTiempo,
  deposito,
  setDeposito,
  tiempoAlquilerDias,
  unidadMinimaRestrictiva,
  direccionRef,
  barrioRef,
  fechaInicioRef,
  tiempoAlquilerRef,
  depositoRef,
}: AlquilerSectionProps) {
  return (
    <>
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
                onChange={(e) =>
                  setCantidadTiempo(parseInt(e.target.value) || 1)
                }
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
                onChange={(e) =>
                  setUnidadTiempo(e.target.value as UnidadTiempo)
                }
              >
                {OPCIONES_UNIDAD_TIEMPO.map((opcion) => {
                  const deshabilitada = !unidadMinimaPermiteUnidadTiempo(
                    (
                      {
                        dias: "DIA",
                        semanas: "SEMANA",
                        meses: "MES",
                      } as const
                    )[unidadMinimaRestrictiva],
                    opcion.valor,
                  );

                  return (
                    <option
                      key={opcion.valor}
                      value={opcion.valor}
                      disabled={deshabilitada}
                    >
                      {opcion.etiqueta}
                      {deshabilitada ? " (no disponible)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <p className="text-sm text-muted" style={{ marginTop: 4 }}>
              Equivale a {tiempoAlquilerDias} día(s). El backend siempre
              guarda la duración en días.
            </p>

            {unidadMinimaRestrictiva !== "dias" && (
              <p className="text-sm text-warning" style={{ marginTop: 4 }}>
                Uno o más productos de este alquiler solo pueden alquilarse
                por{" "}
                {unidadMinimaRestrictiva === "semanas"
                  ? "semana o mes"
                  : "mes"}
                .
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
    </>
  );
}