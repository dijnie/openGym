import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { ZALO_API_BASE } from '../lib/zalo.js'
import { askAddDeviceData } from '../sheets.jsx'
import { Button } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'

// Testing entry for existing openGym accounts. Zalo SSO is a separate server integration.
export default function ZaloLogin() {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const connect = async event => {
    event.preventDefault()
    if (busy || !code.trim()) return
    setBusy(true)
    setError('')
    try { await useStore.getState().connectToServer(ZALO_API_BASE, code.trim(), askAddDeviceData) }
    catch (e) { setError(e.message || 'Không thể kết nối. Vui lòng thử lại.') }
    finally { setBusy(false) }
  }
  return <div className="narrow" style={{ paddingTop: '12vh' }}>
    <div style={{ fontSize: 48, color: 'var(--acc)' }}><Icon name="dumbbell" /></div>
    <h1>openGym</h1>
    <p className="muted">Kết nối tài khoản để xem lịch tập và tiếp tục ghi lại buổi tập của bạn.</p>
    <div className="card small" style={{ margin: '20px 0', lineHeight: 1.6 }}>
      Mở <strong>{new URL(ZALO_API_BASE).host}</strong> trong trình duyệt, đăng nhập và chọn
      {' '}<strong>Settings → Account → Pair the mobile app</strong>. Nhập mã vừa tạo bên dưới.
    </div>
    <form onSubmit={connect}>
      <label htmlFor="zalo-pair-code">Mã kết nối</label>
      <input id="zalo-pair-code" className="input" value={code} maxLength={8}
        onChange={e => setCode(e.target.value.toUpperCase())} autoCapitalize="characters" autoComplete="off"
        spellCheck={false} placeholder="XXXXXXXX" required disabled={busy}
        style={{ margin: '8px 0 16px', letterSpacing: '.15em', textAlign: 'center' }} />
      {error && <p role="alert" style={{ color: 'var(--red)' }}>{error}</p>}
      <Button variant="primary" type="submit" disabled={busy || !code.trim()}>{busy ? 'Đang kết nối…' : 'Kết nối tài khoản'}</Button>
    </form>
    <p className="dim small">Mã có hiệu lực 5 phút và chỉ dùng một lần.</p>
  </div>
}
