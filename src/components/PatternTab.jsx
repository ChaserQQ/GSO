import React, { useEffect, useState } from 'react'
import { getAll, putOne, delOne } from '../lib/db.js'
import { addDays, format, parseISO } from 'date-fns'
import { weekday, tripDays, fmtDate } from '../lib/derive.js'

export default function PatternTab({ onSaved }) {
  const [patterns, setPatterns] = useState([])
  const [form, setForm] = useState(empty())
  const [selectedId, setSelectedId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [interval, setInterval] = useState(7)
  const [count, setCount] = useState(4)
  const [preview, setPreview] = useState([])
  const [checked, setChecked] = useState({})

  function empty() {
    return { name:'', depAirport:'', retAirport:'', outFlt:'', inFlt:'', days:9 }
  }

  async function reload() {
    const list = await getAll('patterns')
    setPatterns(list)
  }
  useEffect(() => { reload() }, [])

  const set = (k,v) => setForm(p => ({...p, [k]: v}))

  async function savePattern() {
    if (!form.name || !form.depAirport || !form.retAirport) {
      alert('이름과 공항을 입력해 주세요.')
      return
    }
    await putOne('patterns', { ...form, days: Number(form.days) })
    setForm(empty())
    await reload()
  }

  async function deletePattern(id) {
    if (!confirm('패턴 삭제?')) return
    await delOne('patterns', id)
    await reload()
  }

  function generate() {
    const p = patterns.find(x => x.id === Number(selectedId))
    if (!p) { alert('패턴을 선택해 주세요.'); return }
    if (!startDate) { alert('시작일을 선택해 주세요.'); return }
    const items = []
    let cur = parseISO(startDate)
    for (let i = 0; i < Number(count); i++) {
      const dep = format(cur, 'yyyy-MM-dd')
      const ret = format(addDays(cur, p.days - 2), 'yyyy-MM-dd') // days = ret-dep+2
      items.push({
        depAirport: p.depAirport, retAirport: p.retAirport,
        outFlt: p.outFlt, inFlt: p.inFlt,
        depDate: dep, retDate: ret
      })
      cur = addDays(cur, Number(interval))
    }
    setPreview(items)
    setChecked(Object.fromEntries(items.map((_,i) => [i, true])))
  }

  async function saveSelected() {
    const rows = preview.filter((_,i) => checked[i])
    if (rows.length === 0) { alert('선택된 항목이 없습니다.'); return }
    for (const r of rows) {
      await putOne('requests', { ...r, createdAt: new Date().toISOString() })
    }
    alert(`${rows.length}건 저장 완료`)
    setPreview([])
    onSaved?.()
  }

  return (
    <div>
      <div className="panel">
        <h3 style={{margin:'0 0 8px'}}>① 패턴 등록</h3>
        <div className="grid3">
          <div style={{gridColumn:'span 3'}}><label>패턴 이름</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="예: CDG/MXP 9일" style={{width:'100%'}}/></div>
          <div><label>출발 공항</label><input value={form.depAirport} onChange={e=>set('depAirport',e.target.value.toUpperCase())}/></div>
          <div><label>O-FLT</label><input value={form.outFlt} onChange={e=>set('outFlt',e.target.value)}/></div>
          <div><label>일수</label><input type="number" value={form.days} onChange={e=>set('days',e.target.value)}/></div>
          <div><label>리턴 공항</label><input value={form.retAirport} onChange={e=>set('retAirport',e.target.value.toUpperCase())}/></div>
          <div><label>I-FLT</label><input value={form.inFlt} onChange={e=>set('inFlt',e.target.value)}/></div>
          <div></div>
        </div>
        <div className="row" style={{marginTop:8}}>
          <button className="primary" onClick={savePattern}>💾 패턴 저장</button>
        </div>

        {patterns.length > 0 && (
          <table style={{marginTop:12}}>
            <thead><tr><th>이름</th><th>출발</th><th>O-FLT</th><th>리턴</th><th>I-FLT</th><th>일수</th><th></th></tr></thead>
            <tbody>
              {patterns.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td><td>{p.depAirport}</td><td>{p.outFlt}</td>
                  <td>{p.retAirport}</td><td>{p.inFlt}</td><td>{p.days}</td>
                  <td><button className="danger" onClick={()=>deletePattern(p.id)}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h3 style={{margin:'0 0 8px'}}>② 일괄 생성</h3>
        <div className="row">
          <div><label>패턴</label>
            <select value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
              <option value="">선택...</option>
              {patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label>첫 출발일</label><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></div>
          <div><label>반복주기(일)</label><input type="number" value={interval} onChange={e=>setInterval(e.target.value)} style={{width:80}}/></div>
          <div><label>횟수</label><input type="number" value={count} onChange={e=>setCount(e.target.value)} style={{width:80}}/></div>
          <div style={{alignSelf:'flex-end'}}><button className="primary" onClick={generate}>🔍 미리보기</button></div>
        </div>

        {preview.length > 0 && (
          <>
            <table style={{marginTop:12}}>
              <thead><tr><th></th><th>출발</th><th>출발일</th><th>요일</th><th>리턴</th><th>리턴일</th><th>요일</th><th>일수</th></tr></thead>
              <tbody>
                {preview.map((r,i) => (
                  <tr key={i}>
                    <td><input type="checkbox" checked={!!checked[i]} onChange={e=>setChecked(c => ({...c, [i]: e.target.checked}))}/></td>
                    <td>{r.depAirport} {r.outFlt}</td>
                    <td>{fmtDate(r.depDate)}</td><td>{weekday(r.depDate)}</td>
                    <td>{r.retAirport} {r.inFlt}</td>
                    <td>{fmtDate(r.retDate)}</td><td>{weekday(r.retDate)}</td>
                    <td>{tripDays(r.depDate, r.retDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="row" style={{marginTop:8}}>
              <button className="primary" onClick={saveSelected}>✓ 선택 항목 일괄 저장</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
