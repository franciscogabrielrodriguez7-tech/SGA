import { z } from 'zod';

// Expresión regular para teléfonos en Colombia (10 dígitos, empieza con 3 o 6)
// Se puede expandir para latam si es necesario.
const phoneRegex = /^(3|6)\d{9}$/;

export const phoneValidation = z
  .string()
  .min(1, "El teléfono es requerido")
  .regex(phoneRegex, "Debe ser un celular válido de 10 dígitos (ej. 3001234567)");
