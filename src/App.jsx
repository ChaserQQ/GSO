import React, { useState } from 'react'
import RequestsTab from './components/RequestsTab.jsx'
import CrsImportTab from './components/CrsImportTab.jsx'
import PatternsTab from './components/PatternsTab.jsx'
import AdmTab from './components/AdmTab.jsx'
import AirportsTab from './components/AirportsTab.jsx'
import BackupBar from './components/BackupBar.jsx'

const TABS = [
  { id: 'requests', label: '📋 요청 목록' },
  { id: 'crs', label: '✈️ CRS 입력' },
  { id: 'patterns', label: '🔁 패턴 일괄' },
  { id: 'adm', label: '📤 ADM' },
  { id: 'airports', label: '🌐 공항-편명' },
]

export default function App() {
  const [tab, setTab] = useState('requests')
  const [toast, setToast] = useState(null)

  function notify(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="app">
      <div className="header">
        <div className="title">GSO 관리</div>
        <div style={{flex:1}} />
        <BackupBar onNotify={notify} />
      </div>
      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'requests' && <RequestsTab onNotify={notify} />}
      {tab === 'crs' && <CrsImportTab onNotify={notify} onDone={() => setTab('requests')} />}
      {tab === 'patterns' && <PatternsTab onNotify={notify} />}
      {tab === 'adm' && <AdmTab onNotify={notify} />}
      {tab === 'airports' && <AirportsTab onNotify={notify} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
