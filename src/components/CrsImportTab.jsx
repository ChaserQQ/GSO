import React, { useState } from 'react'
import { parseCrsBlock, HUB } from '../lib/crs.js'
import { put } from '../lib/db.js'
import { makePattern, weekday, fmtDate, tripDays } from '../lib/derive.js'
import RequestForm from './RequestForm.jsx'

const SAMPLE = `  1  KE 901 K 11NOV 3 ICNCDG DK1  1205 1830  11NOV  E  0 77W DL
  2  KE 928 K 18NOV 3 MXPICN DK1  2005 1535  19NOV  E  0 789 M`

export default function CrsImportTab({ onNotify, onDone }) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')

  function handleParse() {
    setError('')
    const res = parseCrsBlock(text)
    setParsed(res)
    if (res.ok) {
      setForm({
        status: '요청',
        ...res.result,
      })
    } else {
      setError(res.error || '파싱 실패')
      setForm(null)
    }
  }

  async function handleSave() {
    const pattern = makePattern(form.arrAirport, form.depAirport)
    await put('requests', {
      ...form,
      pattern,
      createdAt: new Date().toISOString(),
    })
    onNotify?.('저장 완료')
    setText(''); setParsed(null); setForm(null)
    onDone?.()
  }

  return (
    <>
      <div className="panel">
        <h3>1️⃣ CRS 스케줄 붙여넣기</h3>
        <div className="hint" style={{marginBottom:6}}>
          예시: HUB({HUB}) 기준으로 out/in 자동 인식
        </div>
        <textarea rows={6} value={text} onChange={e => setText(e.target.value)}
                  placeholder={SAMPLE} />
        <div className="row" style={{marginTop:8, gap:6}}>
          <button className="btn primary" onClick={handleParse}>🔍 파싱</button>
          <button className="btn ghost sm" onClick={() => setText(SAMPLE)}>샘플 채우기</button>
          <button className="btn ghost sm" onClick={() => { setText(''); setParsed(null); setForm(null) }}>초기화</button>
          <div style={{flex:1}} />
          {error && <span className="danger">⚠ {error}</span>}
        </div>

        {parsed?.segments?.length > 0 && (
          <div style={{marginTop:12}}>
            <div className="muted" style={{fontSize:12, marginBottom:4}}>인식된 세그먼트 {parsed.segments.length}개</div>
            <table>
              <thead><tr><th>편명</th><th>날짜</th><th>From</th><th>To</th><th>방향</th></tr></thead>
              <tbody>
                {parsed.segments.map((s, i) => (
                  <tr key={i}>
                    <td>{s.flight}</td>
                    <td>{fmtDate(s.date)} ({weekday(s.date)})</td>
                    <td>{s.from}</td>
                    <td>{s.to}</td>
                    <td>{s.from === HUB ? <span className="badge ok">OUT</span> : s.to === HUB ? <span className="badge warn">IN</span> : <span className="badge">-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <>
          <div className="panel">
            <h3>2️⃣ 미리보기 (수정 가능)</h3>
          </div>
          <RequestForm value={form} onChange={setForm} onSubmit={handleSave} submitLabel="💾 저장" />
        </>
      )}

      {!form && (
        <div className="panel">
          <h3>또는 직접 입력</h3>
          <button className="btn" onClick={() => setForm({ status:'요청' })}>+ 빈 폼으로 시작</button>
        </div>
      )}
    </>
  )
}
