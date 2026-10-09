// A separate build flavour; it must never enable Capacitor's native-only features.
export const ZALO = import.meta.env?.VITE_ZALO === '1'
export const ZALO_API_BASE = (import.meta.env?.VITE_ZALO_API_BASE || '').replace(/\/$/, '')
