import React, { useEffect, useState } from 'react'
import { all, put, del } from '../lib/db.js'
import { buildAdmDetail, fmtDate } from '../lib/derive.js'

export default function AdmTab({ onNotify }) {
  const [adms, setAdms] = useState([])
  const [requests, setRequests] = useState([])
  const [editing, setEditing] = useState(null)

  async function reload() {
    setAdms(await all('adms'))
    setRequests(await all('requests'))
  }
  useEffect(() => { reload() }, [])

  function findReq(bookingId) {
    return requests.find(r => r.bookingId && r.bookingId === bookingId)
  }

  async function save() {
    await put('adms', { ...editing, updatedAt: new Date().toISOString() })
    setEditing(null)
    reload()
    onNotify?.('ADM 저장됨')
  }

  async function copyDetail(a) {
    const r = findReq(a.bookingId)
    await navigator.clipboard.writeText(buildAdmDetail(a, r))
    onNotify?.('ADM 상세 복사됨')
  }

  return (
    <>
      <div className="panel">
        <div className="row" style={{justifyContent:'space-between'}}>
          <h3 style={{margin:0}}>📤 ADM 목록</h3>
          <button className="btn primary sm" onClick={() => setEditing({ kind:'모객성', status:'진행' })}>+ ADM 추가</button>
        </div>
        <table style={{marginTop:8}}>
          <thead><tr><th>#</th><th>구분</th><th>Booking ID</th><th>연결 요청</th><th>금액</th><th>상태</th><th></th></tr></thead>
          <tbody>
            {adms.map(a => {
              const r = findReq(a.bookingId)
              return (
                <tr key={a.id}>
                  <td className="muted">{a.id}</td>
                  <td><span className="badge">{a.kind}</span></td>
                  <td>{a.bookingId}</td>
                  <td>{r ? `${r.arrAirport} ${fmtDate(r.depDate)} ${r.requester || ''}` : <span className="danger">미연결</span>}</td>
                  <td>{a.amount}</td>
                  <td><span className="badge">{a.status}</span></td>
                  <td>
                    <button className="btn ghost sm" onClick={() => copyDetail(a)}>📋</button>
                    <button className="btn ghost sm" onClick={() => setEditing(a)}>✏️</button>
                    <button className="btn ghost sm" onClick={async () => { if (confirm('삭제?')) { await del('adms', a.id); reload() } }}>🗑️</button>
                  </td>
                </tr>
              )
            })}
            {adms.length === 0 && <tr><td colSpan={7} style={{textAlign:'center', padding:16}} className="muted">ADM 없음</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="panel">
          <h3>ADM {editing.id ? '편집' : '신규'}</h3>
          <div className="row">
            <div className="col"><label>구분</label>
              <select value={editing.kind} onChange={e => setEditing({...editing, kind:e.target.value})}>
                <option>모객성</option><option>테마성</option><option>기타</option>
              </select>
            </div>
            <div className="col"><label>Booking ID</label><input value={editing.bookingId||''} onChange={e => setEditing({...editing, bookingId:e.target.value})} /></div>
            <div className="col"><label>금액</label><input value={editing.amount||''} onChange={e => setEditing({...editing, amount:e.target.value})} /></div>
            <div className="col"><label>상태</label>
              <select value={editing.status} onChange={e => setEditing({...editing, status:e.target.value})}>
                <option>진행</option><option>완료</option><option>이의</option>
              </select>
            </div>
            <div className="col" style={{flex:1, minWidth:200}}><label>비고</label><input value={editing.note||''} onChange={e => setEditing({...editing, note:e.target.value})} /></div>
          </div>
          {editing.bookingId && (
            <div className="hint" style={{marginTop:8}}>
              연결: {findReq(editing.bookingId) ? <span className="ok">✓ {findReq(editing.bookingId).arrAirport} {fmtDate(findReq(editing.bookingId).depDate)}</span> : <span className="danger">해당 Booking ID 요청 없음</span>}
            </div>
          )}
          <div className="row" style={{marginTop:8}}>
            <button className="btn primary" onClick={save}>💾 저장</button>
            <button className="btn ghost" onClick={() => setEditing(null)}>취소</button>
          </div>
        </div>
      )}
    </>
  )
}
