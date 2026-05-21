import React, { useEffect, useState } from 'react'
import { all } from '../lib/db.js'
import { weekday, tripDays, fmtDate, makePattern, buildEscalation } from '../lib/derive.js'

const STATUS_OPTIONS = ['요청', '진행중', '확정', '취소']

export default function RequestForm({ value, onChange, onSubmit, submitLabel = '저장' }) {
  const [airports, setAirports] = useState([])
  const v = value

  useEffect(() => { all('airports').then(setAirports) }, [])

  function set(field, val) {
    onChange({ ...v, [field]: val })
  }

  // 공항 자동완성: 코드 입력 시 편명 매핑
  function setArrAirport(code) {
    const c = code.toUpperCase()
    const a = airports.find(x => x.code === c)
    onChange({
      ...v,
      arrAirport: c,
      oFlt: a?.outboundFlt || v.oFlt,
      // 동일조 가정: 리턴 공항 비어있으면 같이 채움
      depAirport: v.depAirport || c,
      iFlt: v.iFlt || a?.inboundFlt || '',
    })
  }
  function setDepAirport(code) {
    const c = code.toUpperCase()
    const a = airports.find(x => x.code === c)
    onChange({
      ...v,
      depAirport: c,
      iFlt: a?.inboundFlt || v.iFlt,
    })
  }

  const pattern = makePattern(v.arrAirport, v.depAirport)
  const days = tripDays(v.depDate, v.retDate)
  const escal = buildEscalation({ ...v, pattern })

  async function copyEscalation() {
    await navigator.clipboard.writeText(escal)
    alert('Escalation 비고가 클립보드로 복사되었습니다')
  }

  return (
    <>
      <div className="panel">
        <h3>스케줄</h3>
        <div className="row">
          <div className="col">
            <label>출발 (현지 도착)</label>
            <input list="airport-list" value={v.arrAirport || ''} onChange={e => setArrAirport(e.target.value)} placeholder="CDG" style={{width:80}} />
          </div>
          <div className="col">
            <label>O-FLT</label>
            <input value={v.oFlt || ''} onChange={e => set('oFlt', e.target.value.toUpperCase())} placeholder="KE901" style={{width:90}} />
          </div>
          <div className="col">
            <label>출발일</label>
            <input type="date" value={v.depDate || ''} onChange={e => set('depDate', e.target.value)} />
          </div>
          <div className="col">
            <label>요일</label>
            <div style={{padding:'6px 8px', minWidth:30}}>{weekday(v.depDate)}</div>
          </div>
          <div style={{width:20}} />
          <div className="col">
            <label>리턴 (현지 출발)</label>
            <input list="airport-list" value={v.depAirport || ''} onChange={e => setDepAirport(e.target.value)} placeholder="MXP" style={{width:80}} />
          </div>
          <div className="col">
            <label>I-FLT</label>
            <input value={v.iFlt || ''} onChange={e => set('iFlt', e.target.value.toUpperCase())} placeholder="KE928" style={{width:90}} />
          </div>
          <div className="col">
            <label>리턴일</label>
            <input type="date" value={v.retDate || ''} onChange={e => set('retDate', e.target.value)} />
          </div>
          <div className="col">
            <label>요일</label>
            <div style={{padding:'6px 8px', minWidth:30}}>{weekday(v.retDate)}</div>
          </div>
          <div className="col">
            <label>일수</label>
            <div style={{padding:'6px 8px', fontWeight:600}}>{days}</div>
          </div>
        </div>
        <datalist id="airport-list">
          {airports.map(a => <option key={a.code} value={a.code}>{a.region}</option>)}
        </datalist>
        {pattern && <div className="hint">패턴: <span className="badge">{pattern}</span></div>}
      </div>

      <div className="panel">
        <h3>요청 정보</h3>
        <div className="row">
          <div className="col">
            <label>요청자</label>
            <input value={v.requester || ''} onChange={e => set('requester', e.target.value)} style={{width:120}} />
          </div>
          <div className="col">
            <label>수요명</label>
            <input value={v.demandName || ''} onChange={e => set('demandName', e.target.value)} style={{width:200}} />
          </div>
          <div className="col">
            <label>상태</label>
            <select value={v.status || '요청'} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col">
            <label>진행상태(E번호)</label>
            <input value={v.eNum || ''} onChange={e => set('eNum', e.target.value)} style={{width:100}} />
          </div>
          <div className="col">
            <label>요청석</label>
            <input type="number" value={v.reqSeats ?? ''} onChange={e => set('reqSeats', e.target.value === '' ? null : Number(e.target.value))} style={{width:70}} />
          </div>
          <div className="col">
            <label>지원석</label>
            <input type="number" value={v.suppSeats ?? ''} onChange={e => set('suppSeats', e.target.value === '' ? null : Number(e.target.value))} style={{width:70}} />
          </div>
          <div className="col">
            <label>운임</label>
            <input value={v.fare || ''} onChange={e => set('fare', e.target.value)} style={{width:100}} />
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>예약/연결</h3>
        <div className="row">
          <div className="col">
            <label>Booking ID</label>
            <input value={v.bookingId || ''} onChange={e => set('bookingId', e.target.value)} style={{width:120}} />
          </div>
          <div className="col">
            <label>PNR</label>
            <input value={v.pnr || ''} onChange={e => set('pnr', e.target.value.toUpperCase())} style={{width:100}} />
          </div>
          <div className="col">
            <label>공급ID</label>
            <input value={v.supplierId || ''} onChange={e => set('supplierId', e.target.value)} style={{width:100}} />
          </div>
          <div className="col">
            <label>상품코드</label>
            <input value={v.productCode || ''} onChange={e => set('productCode', e.target.value)} style={{width:120}} />
          </div>
          <div className="col">
            <label>확정일자</label>
            <input type="date" value={v.confirmedAt || ''} onChange={e => set('confirmedAt', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Escalation 비고 (미리보기)</h3>
        <div className="preview">{escal}</div>
        <div className="row" style={{marginTop:8, justifyContent:'space-between'}}>
          <button className="btn ghost sm" onClick={copyEscalation}>📋 복사</button>
          {onSubmit && <button className="btn primary" onClick={onSubmit}>{submitLabel}</button>}
        </div>
      </div>
    </>
  )
}
