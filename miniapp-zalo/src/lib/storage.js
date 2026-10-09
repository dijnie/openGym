import { ZALO } from './zalo.js'

let nativeStorage

// Installed by the Zalo entry before importing the stores, which read on module load.
export function useNativeStorage(storage) {
  nativeStorage = storage
}

const backend = () => {
  if (!ZALO) return globalThis.localStorage
  if (!nativeStorage) throw new Error('Zalo storage has not been initialized')
  return nativeStorage
}

// Do not replace window.localStorage: the SDK owns its own storage implementation.
// Resolve the browser backend on each call, preserving blocked-storage errors and tests.
export const appStorage = {
  getItem(key) { return backend().getItem(String(key)) ?? null },
  setItem(key, value) { backend().setItem(String(key), String(value)) },
  removeItem(key) { backend().removeItem(String(key)) },
}
