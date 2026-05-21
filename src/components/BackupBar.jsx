import React, { useRef } from 'react'
import { exportAll, importAll } from '../lib/db.js'
import { download } from '../lib/csv.js'

export default function BackupBar({ onNotify }) {
  const fileRef = useRef(null)

  async function handleExport() {
    const data = await exportAll()
    const today = new Date().toISOString().slice(0,10)
    download(`gso-backup-${today}.json`, JSON.stringify(data, null, 2), 'application/json')
    onNotify?.('백업 파일 다운로드 완료')
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      await importAll(payload, { merge: true })
      onNotify?.('복원 완료. 새로고침해주세요.')
      setTimeout(() => location.reload(), 800)
    } catch (err) {
      alert('파일 형식이 올바르지 않습니다: ' + err.message)
    }
    e.target.value = ''
  }

  return (
    <div className="row" style={{gap:6}}>
      <button className="btn ghost sm" onClick={handleExport}>⬇️ 백업</button>
      <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>⬆️ 복원</button>
      <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} style={{display:'none'}} />
    </div>
  )
}
