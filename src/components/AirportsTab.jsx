import React, { useEffect, useState } from 'react'
import { getAll, putOne, delOne } from '../lib/db.js'

const REGIONS = ['서유럽','동유럽','동/서유럽','이베리아','지중해','중동']

export default function AirportsTab({ refreshKey, onChanged }) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ code:'', region:'서유럽', outboundFlt:'', inboundFlt:'' })

  async function reload() {
    const list = await getAll('airports')
    setRows(list.sort((a,b) => a.code.localeCompare(b.code)))
  }
  useEffect(() => { reload() }, [refreshKey])

  const set = (k,v) => setForm(p => ({...p, [k]: v}))

  async function save() {
    if (!form.code) { alert('공항 코드를 입력하세요'); return }
    await putOne('airports', { ...form, code: form.code.toUpperCase() })
    setForm({ code:'', region:'서유럽', outboundFlt:'', inboundFlt:'' })
    await reload()
    onChanged?.()
  }

  async function remove(code) {
    if (!confirm(`${code} 삭제?`)) return
    await delOne('airports', code)
    await reload()
    onChanged?.()
  }

  return (
    <div>
      <div className="panel">
        <h3 style={{margin:'0 0 8px'}}>공항-편명 등록</h3>
        <div className="row">
          <div><label>공항 코드</label><input value={form.code} onChange={e=>set('code',e.target.value.toUpperCase())} style={{width:80}}/></div>
          <div><label>권역</label>
            <select value={form.region} onChange={e=>set('region',e.target.value)}>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div><label>출발편 (O-FLT)</label><input value={form.outboundFlt} onChange={e=>set('outboundFlt',e.target.value)} style={{width:100}}/></div>
          <div><label>리턴편 (I-FLT)</label><input value={form.inboundFlt} onChange={e=>set('inboundFlt',e.target.value)} style={{width:100}}/></div>
          <div style={{alignSelf:'flex-end'}}><button className="primary" onClick={save}>저장</button></div>
        </div>
      </div>

      <div className="panel" style={{padding:0}}>
        {rows.length===0 ? (
          <div className="empty">등록된 공항이 없습니다. (백업 JSON 파일 복원 가능)</div>
        ) : (
          <table>
            <thead><tr><th>공항</th><th>권역</th><th>O-FLT</th><th>I-FLT</th><th></th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.code}>
                  <td><b>{r.code}</b></td>
                  <td><span className={`badge ${r.region}`}>{r.region}</span></td>
                  <td>{r.outboundFlt}</td>
                  <td>{r.inboundFlt}</td>
                  <td><button className="danger" onClick={()=>remove(r.code)}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
