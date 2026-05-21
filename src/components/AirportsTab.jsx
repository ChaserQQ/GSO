import React, { useEffect, useState } from 'react'
import { all, put, del } from '../lib/db.js'

export default function AirportsTab({ onNotify }) {
  const [rows, setRows] = useState([])
  const [editing, setEditing] = useState(null)

  async function reload() {
    setRows((await all('airports')).sort((a, b) => (a.region||'').localeCompare(b.region||'') || a.code.localeCompare(b.code)))
  }
  useEffect(() => { reload() }, [])

  async function save() {
    if (!editing.code) { alert('공항 코드는 필수'); return }
    await put('airports', { ...editing, code: editing.code.toUpperCase() })
    setEditing(null)
    reload()
    onNotify?.('저장됨')
  }

  return (
    <>
      <div className="panel">
        <div className="row" style={{justifyContent:'space-between'}}>
          <h3 style={{margin:0}}>🌐 공항-편명 매핑</h3>
          <button className="btn primary sm" onClick={() => setEditing({ code:'', region:'서유럽', outboundFlt:'', inboundFlt:'' })}>+ 추가</button>
        </div>
        <table style={{marginTop:8}}>
          <thead><tr><th>구분</th><th>공항</th><th>O-FLT</th><th>I-FLT</th><th></th></tr></thead>
          <tbody>
            {rows.map(a => (
              <tr key={a.code}>
                <td><span className={`badge region-${a.region}`}>{a.region}</span></td>
                <td><strong>{a.code}</strong></td>
                <td>{a.outboundFlt}</td>
                <td>{a.inboundFlt}</td>
                <td>
                  <button className="btn ghost sm" onClick={() => setEditing(a)}>✏️</button>
                  <button className="btn ghost sm" onClick={async () => { if (confirm(`${a.code} 삭제?`)) { await del('airports', a.code); reload() } }}>🗑️</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', padding:16}} className="muted">데이터 없음 - JSON 복원 또는 + 추가</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="panel">
          <h3>공항 {editing.code ? '편집' : '신규'}</h3>
          <div className="row">
            <div className="col"><label>구분</label>
              <select value={editing.region} onChange={e => setEditing({...editing, region:e.target.value})}>
                <option>서유럽</option><option>동유럽</option><option>동/서유럽</option><option>이베리아</option><option>지중해</option><option>중동</option><option>기타</option>
              </select>
            </div>
            <div className="col"><label>공항 코드</label><input value={editing.code} onChange={e => setEditing({...editing, code:e.target.value.toUpperCase()})} style={{width:80}} /></div>
            <div className="col"><label>O-FLT (출발)</label><input value={editing.outboundFlt} onChange={e => setEditing({...editing, outboundFlt:e.target.value.toUpperCase()})} style={{width:100}} /></div>
            <div className="col"><label>I-FLT (리턴)</label><input value={editing.inboundFlt} onChange={e => setEditing({...editing, inboundFlt:e.target.value.toUpperCase()})} style={{width:100}} /></div>
          </div>
          <div className="row" style={{marginTop:8}}>
            <button className="btn primary" onClick={save}>💾 저장</button>
            <button className="btn ghost" onClick={() => setEditing(null)}>취소</button>
          </div>
        </div>
      )}
    </>
  )
}
