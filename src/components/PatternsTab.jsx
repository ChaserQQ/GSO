import React, { useEffect, useState } from 'react'
import { all, put, del } from '../lib/db.js'
import { generateScheduleByPattern } from '../lib/crs.js'
import { weekday, fmtDate, tripDays, makePattern } from '../lib/derive.js'

export default function PatternsTab({ onNotify }) {
  const [patterns, setPatterns] = useState([])
  const [airports, setAirports] = useState([])
  const [editing, setEditing] = useState(null)

  // 일괄 생성용
  const [genState, setGenState] = useState({ patternId: '', startDate: '', intervalDays: 7, count: 4 })
  const [preview, setPreview] = useState([])
  const [selected, setSelected] = useState({})

  async function reload() {
    setPatterns(await all('patterns'))
    setAirports(await all('airports'))
  }
  useEffect(() => { reload() }, [])

  function newPattern() {
    setEditing({ name: '', arrAirport: '', oFlt: '', depAirport: '', iFlt: '', tripDays: 9 })
  }

  async function savePattern() {
    if (!editing.name || !editing.arrAirport) { alert('이름과 출발 공항은 필수'); return }
    const data = {
      ...editing,
      pattern: makePattern(editing.arrAirport, editing.depAirport),
      updatedAt: new Date().toISOString(),
    }
    await put('patterns', data)
    setEditing(null)
    reload()
    onNotify?.('패턴 저장됨')
  }

  async function removePattern(p) {
    if (!confirm(`${p.name} 삭제?`)) return
    await del('patterns', p.id)
    reload()
  }

  function genPreview() {
    const p = patterns.find(x => x.id === Number(genState.patternId))
    if (!p) { alert('패턴을 선택하세요'); return }
    if (!genState.startDate) { alert('시작일을 입력하세요'); return }
    const list = generateScheduleByPattern({
      pattern: p,
      startDate: genState.startDate,
      intervalDays: Number(genState.intervalDays),
      count: Number(genState.count),
    })
    setPreview(list)
    setSelected(Object.fromEntries(list.map((_, i) => [i, true])))
  }

  async function saveSelected() {
    const toSave = preview.filter((_, i) => selected[i])
    if (toSave.length === 0) { alert('선택된 항목 없음'); return }
    for (const r of toSave) {
      await put('requests', {
        ...r,
        status: '요청',
        pattern: makePattern(r.arrAirport, r.depAirport),
        createdAt: new Date().toISOString(),
      })
    }
    setPreview([]); setSelected({})
    onNotify?.(`${toSave.length}건 저장 완료`)
  }

  return (
    <>
      <div className="panel">
        <div className="row" style={{justifyContent:'space-between'}}>
          <h3 style={{margin:0}}>📐 패턴 목록</h3>
          <button className="btn primary sm" onClick={newPattern}>+ 패턴 추가</button>
        </div>
        <table style={{marginTop:8}}>
          <thead><tr><th>이름</th><th>출발</th><th>O-FLT</th><th>리턴</th><th>I-FLT</th><th>일수</th><th></th></tr></thead>
          <tbody>
            {patterns.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong> <span className="muted">({p.pattern})</span></td>
                <td>{p.arrAirport}</td><td>{p.oFlt}</td>
                <td>{p.depAirport}</td><td>{p.iFlt}</td>
                <td>{p.tripDays}</td>
                <td>
                  <button className="btn ghost sm" onClick={() => setEditing(p)}>✏️</button>
                  <button className="btn ghost sm" onClick={() => removePattern(p)}>🗑️</button>
                </td>
              </tr>
            ))}
            {patterns.length === 0 && <tr><td colSpan={7} style={{textAlign:'center', padding:16}} className="muted">패턴 없음 - 우상단 + 패턴 추가</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="panel">
          <h3>패턴 {editing.id ? '편집' : '신규'}</h3>
          <div className="row">
            <div className="col"><label>이름</label><input value={editing.name} onChange={e => setEditing({...editing, name:e.target.value})} placeholder="CDG/MXP 9일" /></div>
            <div className="col"><label>출발 (도착공항)</label><input list="ap-list" value={editing.arrAirport} onChange={e => setEditing({...editing, arrAirport:e.target.value.toUpperCase()})} style={{width:80}} /></div>
            <div className="col"><label>O-FLT</label><input value={editing.oFlt} onChange={e => setEditing({...editing, oFlt:e.target.value.toUpperCase()})} style={{width:90}} /></div>
            <div className="col"><label>리턴 (출발공항)</label><input list="ap-list" value={editing.depAirport} onChange={e => setEditing({...editing, depAirport:e.target.value.toUpperCase()})} style={{width:80}} /></div>
            <div className="col"><label>I-FLT</label><input value={editing.iFlt} onChange={e => setEditing({...editing, iFlt:e.target.value.toUpperCase()})} style={{width:90}} /></div>
            <div className="col"><label>일수</label><input type="number" value={editing.tripDays} onChange={e => setEditing({...editing, tripDays:Number(e.target.value)})} style={{width:70}} /></div>
          </div>
          <datalist id="ap-list">{airports.map(a => <option key={a.code} value={a.code}>{a.region}</option>)}</datalist>
          <div className="row" style={{marginTop:8}}>
            <button className="btn primary" onClick={savePattern}>💾 저장</button>
            <button className="btn ghost" onClick={() => setEditing(null)}>취소</button>
          </div>
        </div>
      )}

      <div className="panel">
        <h3>🔁 일괄 생성</h3>
        <div className="row">
          <div className="col">
            <label>패턴 선택</label>
            <select value={genState.patternId} onChange={e => setGenState({...genState, patternId:e.target.value})}>
              <option value="">--선택--</option>
              {patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="col"><label>첫 출발일</label><input type="date" value={genState.startDate} onChange={e => setGenState({...genState, startDate:e.target.value})} /></div>
          <div className="col"><label>반복 주기(일)</label><input type="number" value={genState.intervalDays} onChange={e => setGenState({...genState, intervalDays:e.target.value})} style={{width:70}} /></div>
          <div className="col"><label>횟수</label><input type="number" value={genState.count} onChange={e => setGenState({...genState, count:e.target.value})} style={{width:70}} /></div>
          <div className="col"><label>&nbsp;</label><button className="btn" onClick={genPreview}>🔍 미리보기</button></div>
        </div>
        <div className="hint">기본 반복주기: 매주=7, 격주=14, 매월=28~31</div>
      </div>

      {preview.length > 0 && (
        <div className="panel">
          <h3>미리보기 ({preview.length}건)</h3>
          <table>
            <thead><tr><th><input type="checkbox" checked={preview.every((_, i) => selected[i])} onChange={e => setSelected(Object.fromEntries(preview.map((_, i) => [i, e.target.checked])))} /></th><th>출발</th><th>O-FLT</th><th>출발일</th><th>요일</th><th>리턴</th><th>I-FLT</th><th>리턴일</th><th>요일</th><th>일수</th></tr></thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i}>
                  <td><input type="checkbox" checked={!!selected[i]} onChange={e => setSelected({...selected, [i]:e.target.checked})} /></td>
                  <td>{r.arrAirport}</td><td>{r.oFlt}</td>
                  <td>{fmtDate(r.depDate)}</td><td className="muted">{weekday(r.depDate)}</td>
                  <td>{r.depAirport}</td><td>{r.iFlt}</td>
                  <td>{fmtDate(r.retDate)}</td><td className="muted">{weekday(r.retDate)}</td>
                  <td>{tripDays(r.depDate, r.retDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{marginTop:8}}>
            <button className="btn primary" onClick={saveSelected}>✓ 선택 {Object.values(selected).filter(Boolean).length}건 저장</button>
            <button className="btn ghost" onClick={() => { setPreview([]); setSelected({}) }}>취소</button>
          </div>
        </div>
      )}
    </>
  )
}
