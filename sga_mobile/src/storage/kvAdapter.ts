/**
 * Adaptador de almacenamiento clave-valor multiplataforma — SGA Móvil
 *
 * En tiempo de ejecución de React Native / Expo (Metro bundler) delega en
 * `@react-native-async-storage/async-storage`.
 * En entorno de pruebas Node.js (`node --test`), donde el paquete nativo no
 * resuelve ESM sin bundler, cae limpiamente a un diccionario en memoria.
 */

interface KVStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const memoria = new Map<string, string>();
let asyncStorageCache: KVStore | null | undefined = undefined;

async function obtenerAsyncStorageNativo(): Promise<KVStore | null> {
  if (asyncStorageCache !== undefined) return asyncStorageCache;
  // En Node.js puro (ejecución de node --test) evitamos cargar el módulo de RN
  if (
    typeof process !== 'undefined' &&
    process.release?.name === 'node' &&
    typeof window === 'undefined'
  ) {
    asyncStorageCache = null;
    return null;
  }
  try {
    const mod = await import('@react-native-async-storage/async-storage');
    asyncStorageCache = (mod.default ?? mod) as KVStore;
    return asyncStorageCache;
  } catch {
    asyncStorageCache = null;
    return null;
  }
}

export async function kvGet(clave: string): Promise<string | null> {
  const nativo = await obtenerAsyncStorageNativo();
  if (nativo) {
    try {
      const val = await nativo.getItem(clave);
      if (val !== null && val !== undefined) {
        memoria.set(clave, val);
        return val;
      }
    } catch {
      // Fallback a memoria
    }
  }
  return memoria.get(clave) ?? null;
}

export async function kvSet(clave: string, valor: string): Promise<void> {
  memoria.set(clave, valor);
  const nativo = await obtenerAsyncStorageNativo();
  if (nativo) {
    try {
      await nativo.setItem(clave, valor);
    } catch {
      // Fallback a memoria
    }
  }
}

export async function kvRemove(clave: string): Promise<void> {
  memoria.delete(clave);
  const nativo = await obtenerAsyncStorageNativo();
  if (nativo) {
    try {
      await nativo.removeItem(clave);
    } catch {
      // Fallback a memoria
    }
  }
}
