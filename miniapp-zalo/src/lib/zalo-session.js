import { appStorage } from './storage.js'
import { ZALO_API_BASE } from './zalo.js'

const KEY = 'gym_zalo_connection'

export function loadZaloSession() {
  const raw = appStorage.getItem(KEY)
  if (!raw) return null
  let saved
  try { saved = JSON.parse(raw) } catch { return null }
  // A token belongs to the configured server and must not follow a changed API address.
  return saved?.mode === 'remote' && saved.base === ZALO_API_BASE &&
    typeof saved.token === 'string' && saved.token && saved.user?.id ? saved : null
}

export function saveZaloSession(session) {
  appStorage.setItem(KEY, JSON.stringify(session))
}

export function clearZaloSession() {
  appStorage.removeItem(KEY)
}
