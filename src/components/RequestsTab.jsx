import React, { useEffect, useState } from 'react'
import { getAll, delOne, putOne } from '../lib/db.js'
import { weekday, tripDays, fmtDate, buildEscalation, patternKey } from '../lib/derive.js'

export default function RequestsTab({ refreshKey, onChanged }) {
  const [rows, setRows] = useState([])
  const [airports, setAirports] = useState({})
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)

  async function reload() {
    const [reqs, airs] = await Promise.all([getAll('requests'), getAll('airports')])
    setRows(reqs.sort((a,b) => (b.depDate||'').localeCompare(a.depDate||'')))
    setAirports(Object.fromEntries(airs.map(a => [a.code, a])))
  }
  useEffect(() => { reload() }, [refreshKey])

  const filtered = rows.filter(r => {
    if (!q) return true
    const s = q.toLowerCase()
    return (r.depAirport||'').toLowerCase().includes(s) ||
           (r.retAirport||'').toLowerCase().includes(s) ||
           (r.outFlt||'').toLowerCase().includes(s) ||
           (r.inFlt||'').toLowerCase().includes(s) ||
           (r.requester||'').toLowerCase().includes(s) ||
           (r.demandName||'').toLowerCase().includes(s)
  })

  async function handleDelete(id) {
    if (!confirm('삭제할까요?')) return
    await delOne('requests', id)
    onChanged?.()
  }

  async function copyEsc(req) {
    const text = buildEscalation(req)
    await navigator.clipboard.writeText(text)
    alert('Escalation 텍스트가 클립보드에 복사되었어요')
  }

  return (
    <div>
      <div className="toolbar">
        <input placeholder="검색 (공항/편명/요청자)" value={q} onChange={e=>setQ(e.target.value)} style={{width:280}}/>
        <span className="muted">전체 {rows.length}건 / 필터 {filtered.length}건</span>
      </div>

      <div className="panel" style={{padding:0, overflow:'auto'}}>
        {filtered.length===0 ? (
          <div className="empty">데이터 없음. CRS 입력 또는 패턴 일괄 탭에서 추가하세요.</div>
        ) : (
        <table>
          <thead>
            <tr>
              <th>구분</th><th>출발</th><th>O-FLT</th><th>출발일</th><th>요일</th>
              <th>리턴</th><th>I-FLT</th><th>리턴일</th><th>요일</th><th>일수</th>
              <th>패턴</th><th>요청자</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const a = airports[r.depAirport]
              return (
                <tr key={r.id}>
                  <td>{a?.region && <span className={`badge ${a.region}`}>{a.region}</span>}</td>
                  <td><b>{r.depAirport}</b></td>
                  <td>{r.outFlt}</td>
                  <td>{fmtDate(r.depDate)}</td>
                  <td>{weekday(r.depDate)}</td>
                  <td><b>{r.retAirport}</b></td>
                  <td>{r.inFlt}</td>
                  <td>{fmtDate(r.retDate)}</td>
                  <td>{weekday(r.retDate)}</td>
                  <td>{tripDays(r.depDate, r.retDate)}</td>
                  <td><span className="tag">{patternKey(r)}</span></td>
                  <td>{r.requester||''}</td>
                  <td style={{whiteSpace:'nowrap'}}>
                    <button onClick={()=>copyEsc(r)} title="Escalation 복사">📋</button>
                    <button onClick={()=>setEditing(r)} title="편집">✏️</button>
                    <button className="danger" onClick={()=>handleDelete(r.id)} title="삭제">🗑️</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        )}
      </div>

      {editing && <EditModal req={editing} onClose={()=>setEditing(null)} onSaved={()=>{ setEditing(null); onChanged?.() }}/>}
    </div>
  )
}

function EditModal({ req, onClose, onSaved }) {
  const [form, setForm] = useState({...req})
  const set = (k,v) => setForm(p => ({...p, [k]: v}))
  async function save() {
    await putOne('requests', form)
    onSaved?.()
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10}}>
      <div className="panel" style={{minWidth:500, maxWidth:'90vw'}}>
        <h3 style={{margin:'0 0 12px'}}>편집</h3>
        <div className="grid2">
          <div><label>출발 공항</label><input value={form.depAirport||''} onChange={e=>set('depAirport',e.target.value.toUpperCase())}/></div>
          <div><label>리턴 공항</label><input value={form.retAirport||''} onChange={e=>set('retAirport',e.target.value.toUpperCase())}/></div>
          <div><label>O-FLT</label><input value={form.outFlt||''} onChange={e=>set('outFlt',e.target.value)}/></div>
          <div><label>I-FLT</label><input value={form.inFlt||''} onChange={e=>set('inFlt',e.target.value)}/></div>
          <div><label>출발일</label><input type="date" value={form.depDate||''} onChange={e=>set('depDate',e.target.value)}/></div>
          <div><label>리턴일</label><input type="date" value={form.retDate||''} onChange={e=>set('retDate',e.target.value)}/></div>
          <div><label>요청자</label><input value={form.requester||''} onChange={e=>set('requester',e.target.value)}/></div>
          <div><label>요청석</label><input value={form.reqSeats||''} onChange={e=>set('reqSeats',e.target.value)}/></div>
          <div><label>운임</label><input value={form.fare||''} onChange={e=>set('fare',e.target.value)}/></div>
          <div><label>PNR</label><input value={form.pnr||''} onChange={e=>set('pnr',e.target.value)}/></div>
          <div style={{gridColumn:'1/-1'}}><label>수요명</label><input value={form.demandName||''} onChange={e=>set('demandName',e.target.value)} style={{width:'100%'}}/></div>
          <div style={{gridColumn:'1/-1'}}><label>메모</label><textarea value={form.memo||''} onChange={e=>set('memo',e.target.value)}/></div>
        </div>
        <div className="row" style={{marginTop:12, justifyContent:'flex-end'}}>
          <button onClick={onClose}>취소</button>
          <button className="primary" onClick={save}>저장</button>
        </div>
      </div>
    </div>
  )
}
