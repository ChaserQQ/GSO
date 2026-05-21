import React, { useEffect, useState } from 'react'
import { get, put } from '../lib/db.js'
import RequestForm from './RequestForm.jsx'
import { makePattern } from '../lib/derive.js'

export default function EditModal({ id, onClose }) {
  const [data, setData] = useState(null)

  useEffect(() => { get('requests', id).then(setData) }, [id])

  async function handleSave() {
    const pattern = makePattern(data.arrAirport, data.depAirport)
    await put('requests', { ...data, pattern, updatedAt: new Date().toISOString() })
    onClose()
  }

  if (!data) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="row" style={{justifyContent:'space-between', marginBottom:12}}>
          <strong>요청 편집 #{id}</strong>
          <button className="btn ghost sm" onClick={onClose}>✕</button>
        </div>
        <RequestForm value={data} onChange={setData} onSubmit={handleSave} submitLabel="💾 저장" />
      </div>
    </div>
  )
}
