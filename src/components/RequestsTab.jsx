import React, { useEffect, useState, useMemo } from 'react'
import { all, del } from '../lib/db.js'
import { weekday, tripDays, fmtDate, buildEscalation } from '../lib/derive.js'
import EditModal from './EditModal.jsx'
import { toCsv, download } from '../lib/csv.js'

export default function RequestsTab({ onNotify }) {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState({ q: '', status: '', region: '' })
  const [editId, setEditId] = useState(null)
  const [airports, setAirports] = useState([])

  async function reload() {
    setRows((await all('requests')).sort((a, b) => (b.depDate || '').localeCompare(a.depDate || '')))
    setAirports(await all('airports'))
  }
  useEffect(() => { reload() }, [])

  const airportRegion = useMemo(() => Object.fromEntries(airports.map(a => [a.code, a.region])), [airports])

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filter.status && r.status !== filter.status) return false
      if (filter.region && airportRegion[r.arrAirport] !== filter.region) return false
      if (filter.q) {
        const q = filter.q.toLowerCase()
        const hay = [r.requester, r.demandName, r.bookingId, r.pnr, r.arrAirport, r.depAirport, r.oFlt, r.iFlt, r.eNum]
          .filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, filter, airportRegion])

  const totals = useMemo(() => {
    return filtered.reduce((acc, r) => {
      acc.req += Number(r.reqSeats) || 0
      acc.supp += Number(r.suppSeats) || 0
      return acc
    }, { req: 0, supp: 0 })
  }, [filtered])

  async function copyEsc(r) {
    await navigator.clipboard.writeText(buildEscalation(r))
    onNotify?.('Escalation 복사됨')
  }
  async function removeRow(r) {
    if (!confirm(`#${r.id} 삭제할까요?`)) return
    await del('requests', r.id)
    reload()
  }

  function handleCsv() {
    const cols = [
      { key:'arrAirport', label:'출발' }, { key:'oFlt', label:'O-FLT' },
      { key:'depDate', label:'출발일', get: r => fmtDate(r.depDate) },
      { label:'요일', get: r => weekday(r.depDate) },
      { key:'depAirport', label:'리턴' }, { key:'iFlt', label:'I-FLT' },
      { key:'retDate', label:'리턴일', get: r => fmtDate(r.retDate) },
      { label:'요일', get: r => weekday(r.retDate) },
      { label:'일수', get: r => tripDays(r.depDate, r.retDate) },
      { key:'requester', label:'요청자' }, { key:'demandName', label:'수요명' },
      { key:'status', label:'상태' }, { key:'reqSeats', label:'요청석' }, { key:'suppSeats', label:'지원석' },
      { key:'fare', label:'운임' }, { key:'bookingId', label:'Booking' }, { key:'pnr', label:'PNR' },
    ]
    download(`gso-requests-${new Date().toISOString().slice(0,10)}.csv`, toCsv(filtered, cols), 'text/csv')
  }

  return (
    <>
      <div className="panel">
        <div className="row">
          <input placeholder="🔍 검색 (요청자/수요명/공항/PNR/Booking)"
                 value={filter.q} onChange={e => setFilter({...filter, q:e.target.value})}
                 style={{width:300}} />
          <select value={filter.status} onChange={e => setFilter({...filter, status:e.target.value})}>
            <option value="">전체 상태</option>
            <option>요청</option><option>진행중</option><option>확정</option><option>취소</option>
          </select>
          <select value={filter.region} onChange={e => setFilter({...filter, region:e.target.value})}>
            <option value="">전체 권역</option>
            {[...new Set(airports.map(a => a.region))].map(r => <option key={r}>{r}</option>)}
          </select>
          <div style={{flex:1}} />
          <span className="muted">총 {filtered.length}건 · 요청 {totals.req}석 · 지원 {totals.supp}석</span>
          <button className="btn ghost sm" onClick={handleCsv}>⬇️ CSV</button>
        </div>
      </div>

      <div className="panel" style={{padding:0}}>
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>#</th><th>상태</th><th>출발</th><th>O-FLT</th><th>출발일</th><th></th>
                <th>리턴</th><th>I-FLT</th><th>리턴일</th><th></th><th>일수</th>
                <th>요청자</th><th>수요명</th><th>요청/지원</th><th>Booking</th><th>PNR</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td className="muted">{r.id}</td>
                  <td><span className={`badge ${r.status==='확정'?'ok':r.status==='취소'?'danger':'warn'}`}>{r.status||'-'}</span></td>
                  <td><span className={`badge region-${airportRegion[r.arrAirport]||''}`}>{r.arrAirport}</span></td>
                  <td>{r.oFlt}</td>
                  <td>{fmtDate(r.depDate)}</td>
                  <td className="muted">{weekday(r.depDate)}</td>
                  <td><span className={`badge region-${airportRegion[r.depAirport]||''}`}>{r.depAirport}</span></td>
                  <td>{r.iFlt}</td>
                  <td>{fmtDate(r.retDate)}</td>
                  <td className="muted">{weekday(r.retDate)}</td>
                  <td style={{fontWeight:600}}>{tripDays(r.depDate, r.retDate)}</td>
                  <td>{r.requester}</td>
                  <td>{r.demandName}</td>
                  <td>{r.reqSeats ?? '-'}/{r.suppSeats ?? '-'}</td>
                  <td className="muted">{r.bookingId}</td>
                  <td className="muted">{r.pnr}</td>
                  <td>
                    <button className="btn ghost sm" onClick={() => copyEsc(r)} title="Escalation 복사">📋</button>
                    <button className="btn ghost sm" onClick={() => setEditId(r.id)} title="편집">✏️</button>
                    <button className="btn ghost sm" onClick={() => removeRow(r)} title="삭제">🗑️</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={17} style={{textAlign:'center', padding:20}} className="muted">데이터 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editId !== null && (
        <EditModal id={editId} onClose={() => { setEditId(null); reload() }} />
      )}
    </>
  )
}
