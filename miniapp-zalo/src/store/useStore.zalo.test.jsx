// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  vi.stubEnv('VITE_ZALO', '1')
  vi.stubEnv('VITE_ZALO_API_BASE', 'https://gym.phungtiendung.dev')
})
vi.mock('./useUI.js', () => ({ useUI: { getState: () => ({ toast() {}, endRest() {}, stopHold() {} }) } }))

const BASE = 'https://gym.phungtiendung.dev'
const USER = { id: 'u1', name: 'Test' }
const SESSION = { mode: 'remote', base: BASE, token: 'old-token', user: USER }
let data, store, api, native, fetcher, browserStorage
const read = key => JSON.parse(data.get(key) || 'null')
const reply = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  data = new Map()
  native = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  }
  // Import the real store with browser storage unavailable, as on Zalo.
  browserStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Browser storage unavailable') } })
  const { useNativeStorage } = await import('../lib/storage.js')
  useNativeStorage(native)
  fetcher = vi.fn(async url => {
    const path = new URL(url).pathname
    if (path === '/api/me') return reply({ user: USER, token: 'renewed-token' })
    if (path === '/api/config') return reply({ allow_guest: true })
    if (path === '/api/pair/redeem') return reply({ token: 'paired-token', user: USER })
    if (path === '/api/data') return reply({ state: { _rev: 1, _ts: 100, unit: 'lb', workouts: [], routines: [], bodyweight: [] }, rev: 1 })
    return reply({ ok: true })
  })
  vi.stubGlobal('fetch', fetcher)
  api = await import('../lib/api.js')
  store = (await import('./useStore.js')).useStore
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  if (browserStorage) Object.defineProperty(globalThis, 'localStorage', browserStorage)
  else delete globalThis.localStorage
})

describe('Zalo account and storage integration', () => {
  it('requires pairing on first launch even when the server allows guests', async () => {
    await store.getState().boot()
    expect(store.getState()).toMatchObject({ ready: true, user: null })
    expect(store.getState().isGuest()).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('restores a bearer session, renews it and reads server data without cookies', async () => {
    data.set('gym_zalo_connection', JSON.stringify(SESSION))
    await store.getState().boot()
    expect(store.getState().user).toEqual(USER)
    expect(store.getState().S.unit).toBe('lb')
    expect(read('gym_zalo_connection').token).toBe('renewed-token')
    expect(fetcher).toHaveBeenCalledWith(BASE + '/api/me', expect.objectContaining({
      credentials: 'omit', headers: expect.objectContaining({ Authorization: 'Bearer old-token' }),
    }))
    expect(fetcher.mock.calls.every(([url]) => url.startsWith(BASE + '/api/'))).toBe(true)
    expect(api.webauthnOK()).toBe(false)
    expect(api.beacon('/api/activity', {})).toBe(false)
  })

  it('pairs an existing account and persists its connection in native storage', async () => {
    await store.getState().boot()
    await store.getState().connectToServer(BASE, 'ABCDEFGH', async () => false)
    expect(read('gym_zalo_connection')).toMatchObject({ base: BASE, token: 'paired-token', user: USER })
    expect(store.getState().S.unit).toBe('lb')
    expect(store.getState().user).toEqual(USER)
  })

  it('keeps the account and saved workout after a revoked token', async () => {
    data.set('gym_zalo_connection', JSON.stringify(SESSION))
    const workout = { id: 'offline-workout', d: '2026-10-08', entries: [] }
    store.setState({ S: { ...store.getState().S, workouts: [workout] }, user: USER })
    fetcher.mockResolvedValue(new Response('{"error":"not signed in"}', { status: 401 }))
    await store.getState().boot()
    expect(store.getState().user).toEqual(USER)
    expect(store.getState().S.workouts).toEqual([workout])
    expect(store.getState().sync.status).toBe('auth')
    expect(read('gym_zalo_connection').token).toBe('old-token')
  })

  it('drops the token on sign-out, including when the logout request fails', async () => {
    data.set('gym_zalo_connection', JSON.stringify(SESSION))
    await store.getState().boot()
    fetcher.mockImplementation(async url => {
      if (url.endsWith('/api/logout')) throw new TypeError('Network down')
      return reply({ ok: true, rev: 1 })
    })
    const result = await store.getState().signOut()
    expect(result.owed).toBe(false)
    expect(read('gym_zalo_connection')).toBe(null)
    expect(store.getState().user).toBe(null)
    await store.getState().boot()
    expect(store.getState().user).toBe(null)
    await api.api('/api/config')
    expect(fetcher.mock.lastCall[1].headers.Authorization).toBeUndefined()
  })

  it('never sends a saved token to a different backend', async () => {
    data.set('gym_zalo_connection', JSON.stringify({ ...SESSION, base: 'https://other.example' }))
    await store.getState().boot()
    expect(store.getState().user).toBe(null)
    expect(fetcher).not.toHaveBeenCalled()
    await expect(store.getState().connectToServer('https://other.example', 'ABCDEFGH')).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('does not report a successful connection if native storage refuses the token', async () => {
    native.setItem = () => { throw new Error('Storage full') }
    await expect(store.getState().connectToServer(BASE, 'ABCDEFGH')).rejects.toThrow('Storage full')
    expect(store.getState().user).toBe(null)
    await api.api('/api/config')
    expect(fetcher.mock.lastCall[1].headers.Authorization).toBeUndefined()
  })
})
