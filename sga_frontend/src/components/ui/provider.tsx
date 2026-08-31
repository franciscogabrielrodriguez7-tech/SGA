"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { system } from "../../theme"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"

// CORREGIDO: usaba defaultSystem (paleta genérica de Chakra) en vez del
// `system` definido en src/theme.ts, por lo que la paleta cian/verde/azul
// de la guía de diseño nunca se aplicaba realmente.
export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
