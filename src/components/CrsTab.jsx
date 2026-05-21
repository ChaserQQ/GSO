import React, { useEffect, useState } from 'react'
import { parseBlock, buildRequestFromSegments } from '../lib/crs.js'
import { weekday, tripDays, fmtDate, patternKey } from '../lib/derive.js'
import { getAll, putOne } from '../lib/db.js'

const SAMPLE = `  1  KE 901 K 11NOV 3 ICNCDG DK1  1205 1830  11NOV  E  0 77W DL
  2  KE 928 K 18NOV 3 MXPICN DK1  2005 1535  19NOV  E  0 789 M`

export default function CrsTab({ onSaved }) {
  const [text, setText] = useState('')
  const [segs, setSegs] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [airports, setAirports] = useState({})

  useEffect(() => {
    getAll('airports').then(arr => setAirports(Object.fromEntries(arr.map(a => [a.code, a]))))
  }, [])

  function emptyForm() {
    return { depAirport:'', retAirport:'', outFlt:'', inFlt:'', depDate:'', retDate:'', requester:'', reqSeats:'', fare:'', pnr:'', demandName:'', memo:'' }
  }
  const set = (k,v) => setForm(p => ({...p, [k]: v}))

  function handleParse() {
    const parsed = parseBlock(text)
    setSegs(parsed)
    if (parsed.length === 0) {
      alert('인식된 라인이 없습니다. 형식을 확인해 주세요.')
      return
    }
    const built = buildRequestFromSegments(parsed)
    setForm(prev => ({...prev, ...built}))
  }

  function handleClear() {
    setText(''); setSegs([]); setForm(emptyForm())
  }

  async function handleSave() {
    if (!form.depDate || !form.retDate) {
      alert('출발일과 리턴일을 확인해 주세요.')
      return
    }
    const { _segments, _out, _ret, ...row } = form
    row.createdAt = new Date().toISOString()
    await putOne('requests', row)
    alert('저장 완료')
    handleClear()
    onSaved?.()
  }

  const region = airports[form.depAirport]?.region

  return (
    <div>
      <div className="panel">
        <label>CRS 라인 붙여넣기</label>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={SAMPLE}/>
        <div className="row" style={{marginTop:8}}>
          <button className="primary" onClick={handleParse}>🔍 파싱</button>
          <button onClick={()=>setText(SAMPLE)}>샘플 채우기</button>
          <button onClick={handleClear}>초기화</button>
        </div>
      </div>

      {segs.length > 0 && (
        <div className="panel">
          <div className="muted" style={{marginBottom:6}}>인식된 세그먼트 {segs.length}개</div>
          <table>
            <thead><tr><th>편명</th><th>날짜</th><th>출발</th><th>도착</th><th>구분</th></tr></thead>
            <tbody>
              {segs.map((s,i) => (
                <tr key={i}>
                  <td><b>{s.flight}</b></td><td>{fmtDate(s.depDate)} ({weekday(s.depDate)})</td>
                  <td>{s.from}</td><td>{s.to}</td>
                  <td>{s.from==='ICN'?'OUT':s.to==='ICN'?'IN':'-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel">
        <h3 style={{margin:'0 0 8px'}}>요청 정보 {region && <span className={`badge ${region}`} style={{marginLeft:8}}>{region}</span>}</h3>
        <div className="grid3">
          <div><label>출발 공항</label><input value={form.depAirport} onChange={e=>set('depAirport',e.target.value.toUpperCase())}/></div>
          <div><label>O-FLT</label><input value={form.outFlt} onChange={e=>set('outFlt',e.target.value)}/></div>
          <div><label>출발일</label><input type="date" value={form.depDate} onChange={e=>set('depDate',e.target.value)}/></div>
          <div><label>리턴 공항</label><input value={form.retAirport} onChange={e=>set('retAirport',e.target.value.toUpperCase())}/></div>
          <div><label>I-FLT</label><input value={form.inFlt} onChange={e=>set('inFlt',e.target.value)}/></div>
          <div><label>리턴일</label><input type="date" value={form.retDate} onChange={e=>set('retDate',e.target.value)}/></div>
        </div>
        <div className="row" style={{marginTop:8}}>
          <div className="tag">패턴: {patternKey(form) || '-'}</div>
          <div className="tag">일수: {tripDays(form.depDate, form.retDate) || '-'}</div>
          <div className="tag">{weekday(form.depDate)} → {weekday(form.retDate)}</div>
        </div>

        <div className="grid3" style={{marginTop:12}}>
          <div><label>요청자</label><input value={form.requester} onChange={e=>set('requester',e.target.value)}/></div>
          <div><label>요청석</label><input value={form.reqSeats} onChange={e=>set('reqSeats',e.target.value)}/></div>
          <div><label>운임</label><input value={form.fare} onChange={e=>set('fare',e.target.value)}/></div>
          <div><label>PNR</label><input value={form.pnr} onChange={e=>set('pnr',e.target.value)}/></div>
          <div style={{gridColumn:'span 2'}}><label>수요명</label><input value={form.demandName} onChange={e=>set('demandName',e.target.value)} style={{width:'100%'}}/></div>
        </div>
        <div style={{marginTop:8}}>
          <label>메모</label>
          <textarea value={form.memo} onChange={e=>set('memo',e.target.value)} style={{minHeight:60}}/>
        </div>

        <div className="row" style={{marginTop:12}}>
          <button className="primary" onClick={handleSave}>💾 저장</button>
          <button onClick={handleClear}>초기화</button>
        </div>
      </div>
    </div>
  )
}
