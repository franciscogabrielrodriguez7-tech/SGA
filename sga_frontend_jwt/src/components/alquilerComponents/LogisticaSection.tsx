import type { Dispatch, SetStateAction } from "react";

interface LogisticaSectionProps {
  seLleva: boolean;
  setSeLleva: Dispatch<SetStateAction<boolean>>;

  seRecoge: boolean;
  setSeRecoge: Dispatch<SetStateAction<boolean>>;
}

export function LogisticaSection({
  seLleva,
  setSeLleva,
  seRecoge,
  setSeRecoge,
}: LogisticaSectionProps) {
  return (
    <>
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
    </>
  );
}