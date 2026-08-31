// AJUSTADO: el backend (app/schemas/usuario_schema.py) solo acepta
// CC, CE, NIT, PPT. Se retiró 'TI', que no existe en TIPOS_DOCUMENTO_VALIDOS
// del backend y habría producido un 400 al crear el usuario.
export type TipoDocumento = 'CC' | 'CE' | 'NIT' | 'PPT'

export interface Cliente {
  id_usuario: string
  tipo_documento: TipoDocumento
  nombres_usuario: string
  apellidos_usuario: string
  telefono_usuario: string
}