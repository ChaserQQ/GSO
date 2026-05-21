import React, { useRef } from 'react'
import { exportAll, importAll } from '../lib/db.js'

export default function BackupBar({ onChanged }) {
  const fileRef = useRef(null)

  async function handleExport() {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gso-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAll(data)
      alert('복원 완료')
      onChanged?.()
    } catch (err) {
      alert('파일 형식 오류: ' + err.message)
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="row">
      <button onClick={handleExport}>⬇️ 백업</button>
      <button onClick={() => fileRef.current?.click()}>⬆️ 복원</button>
      <input ref={fileRef} type="file" accept="application/json" style={{display:'none'}} onChange={handleImport}/>
    </div>
  )
}
