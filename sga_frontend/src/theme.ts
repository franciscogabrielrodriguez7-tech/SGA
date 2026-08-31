// ============================================================================
// theme.ts — Sistema de diseño de frontend_react_SGA (Chakra UI v3)
// ----------------------------------------------------------------------------
// Este proyecto usa Chakra UI casi exclusivamente vía style props
// (Box, Stack, Heading, Button, Checkbox.Root, etc.), por lo que la
// identidad visual (paleta, radios, tipografía) debe vivir en el
// SISTEMA DE THEMING de Chakra, no en clases CSS sueltas que los
// componentes nunca referencian.
//
// Paleta base (acento seleccionado: cian #2BE6E1), en gama análoga
// verde → cian → azul, coherente con el look "fresco / tecnológico"
// definido en la guía de diseño.
// ============================================================================

import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // --- Escala principal: "brand" (cian) ---
        brand: {
          50: { value: "#EAFDFC" },
          100: { value: "#D2F9F7" },
          200: { value: "#AEE6E4" }, // tono claro de la paleta original
          300: { value: "#7FE0DC" },
          400: { value: "#4CE0DB" },
          500: { value: "#2BE6E1" }, // acento principal (seleccionado en la rueda)
          600: { value: "#22B8B4" },
          700: { value: "#1B8F8C" },
          800: { value: "#146462" },
          900: { value: "#0C3E3D" },
          950: { value: "#063C3A" },
        },
        // --- Escalas secundarias, extraídas directamente de la paleta ---
        mint: {
          400: { value: "#2CE6A0" },
          500: { value: "#22B880" },
        },
        green: {
          400: { value: "#2CE661" },
          500: { value: "#22B84C" },
        },
        sky: {
          400: { value: "#2CB1E6" },
          500: { value: "#228EB8" },
        },
        azure: {
          400: { value: "#2C76E6" },
          500: { value: "#2260B8" },
        },
        // --- Neutros fríos, para acompañar el cian sin competir con él ---
        ink: {
          50: { value: "#F5F8F8" },
          100: { value: "#E9EDEF" },
          200: { value: "#D7DEE1" },
          300: { value: "#A9B4BE" },
          500: { value: "#6B7885" },
          700: { value: "#3D4A57" },
          900: { value: "#16202B" },
          950: { value: "#0B1220" },
        },
      },
      fonts: {
        heading: {
          value:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif",
        },
        body: {
          value:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif",
        },
      },
      radii: {
        // Radios más orgánicos que el default de Chakra
        sm: { value: "8px" },
        md: { value: "12px" },
        lg: { value: "16px" },
        xl: { value: "20px" },
      },
      shadows: {
        // Sombras difuminadas, nunca duras
        sm: { value: "0 1px 2px rgba(11, 18, 32, 0.05)" },
        md: { value: "0 8px 24px rgba(11, 18, 32, 0.08)" },
        lg: { value: "0 16px 40px rgba(11, 18, 32, 0.12)" },
      },
    },

    // ------------------------------------------------------------------
    // Tokens semánticos: así "brand" se comporta como color-scheme
    // completo y se puede usar con colorPalette="brand" en Button,
    // Checkbox, etc. sin repetir el valor exacto en cada componente.
    // ------------------------------------------------------------------
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "{colors.brand.950}" },
          fg: { value: "{colors.brand.700}" },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.200}" },
          emphasized: { value: "{colors.brand.300}" },
          focusRing: { value: "{colors.brand.500}" },
        },
        // Colores de estado reutilizando la misma familia cromática
        success: { value: "{colors.green.500}" },
        info: { value: "{colors.sky.500}" },
        // Superficies globales de la app
        "bg.app": { value: "{colors.ink.50}" },
        "bg.surface": { value: "white" },
        "border.default": { value: "{colors.ink.200}" },
        "fg.default": { value: "{colors.ink.900}" },
        "fg.muted": { value: "{colors.ink.500}" },
      },
    },
  },
});

// `createSystem` combina nuestros tokens con la base de Chakra
// (espaciados, breakpoints, recipes de componentes, etc.)
export const system = createSystem(defaultConfig, config);
