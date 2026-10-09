import { nativeStorage } from 'zmp-sdk/apis'
import { useNativeStorage } from './lib/storage.js'

async function start() {
  // Fail visibly if this Zalo version cannot persist workouts. Never pretend a
  // memory-only cache is durable, or boot before the stores can read their data.
  nativeStorage.getItem('gym_state_v1')
  useNativeStorage(nativeStorage)
  const host = document.getElementById('app')
  if (!host) throw new Error('Missing Mini App root')
  // openGym uses #app for its inner, padded route container. Keep it unique.
  host.id = 'root'
  await import('./main.jsx')
}

start().catch(() => {
  const host = document.getElementById('app') || document.getElementById('root')
  if (host) {
    host.textContent = 'Không thể mở openGym. Vui lòng cập nhật Zalo, kiểm tra kết nối và mở lại Mini App.'
    host.style.cssText = 'padding:32px;font:16px/1.6 system-ui;color:#fff;background:#0c0e12;min-height:100vh'
  }
})
