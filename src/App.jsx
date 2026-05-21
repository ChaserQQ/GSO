import React, { useEffect, useState } from 'react'
import RequestsTab from './components/RequestsTab.jsx'
import CrsTab from './components/CrsTab.jsx'
import PatternTab from './components/PatternTab.jsx'
import AirportsTab from './components/AirportsTab.jsx'
import BackupBar from './components/BackupBar.jsx'

const TABS = [
  { id: 'list',     label: '📋 요청 목록' },
  { id: 'crs',      label: '✈️ CRS 입력' },
  { id: 'pattern',  label: '🔁 패턴 일괄' },
  { id: 'airports', label: '🛫 공항-편명' }
]

export default function App() {
  const [tab, setTab] = useState('list')
  const [refresh, setRefresh] = useState(0)
  const bump = () => setRefresh(v => v+1)
  return (
    <div className="app">
      <header>
        <h1>GSO 관리</h1>
        <BackupBar onChanged={bump} />
      </header>
      <nav>
        {TABS.map(t => (
          <button key={t.id} className={tab===t.id?'active':''} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>
      {tab==='list'     && <RequestsTab refreshKey={refresh} onChanged={bump} />}
      {tab==='crs'      && <CrsTab onSaved={bump} />}
      {tab==='pattern'  && <PatternTab onSaved={bump} />}
      {tab==='airports' && <AirportsTab refreshKey={refresh} onChanged={bump} />}
    </div>
  )
}
