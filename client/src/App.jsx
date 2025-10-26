import React, { useState } from 'react'
import SymptomWizard from './features/SymptomWizard.jsx'
import SlotFinder from './features/SlotFinder.jsx'
import Checkout from './features/Checkout.jsx'

export default function App() {
  const [outcome, setOutcome] = useState(null)   // result of the wizard
  const [selection, setSelection] = useState(null) // chosen slot
  const [bookedId, setBookedId] = useState(null)   // created appt id (optional)

  function resetAll() {
    setOutcome(null)
    setSelection(null)
    setBookedId(null)
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Cadence + MyChart Demo</h1>

      {/* 1) Wizard */}
      <SymptomWizard
        key={outcome ? 'wiz-has-outcome' : 'wiz-empty'}
        onDone={(res) => {
          setOutcome(res)
          setSelection(null)
          setBookedId(null)
        }}
      />

      {/* 2) Slot Finder */}
      {outcome && (
        <SlotFinder
          key={outcome.visitTypeIds?.[0] + ':' + (outcome.departmentIds || []).join(',')}
          outcome={outcome}
          onLoaded={() => {}}
          onSelect={(s) => {
            setSelection(s)
            setBookedId(null)
          }}
          selectedToken={selection?.token}
        />
      )}

      {/* 3) Checkout */}
      {selection && (
        <Checkout
          key={selection.token || 'checkout'}
          outcome={outcome}
          slot={selection}
          onBooked={(id) => setBookedId(id)}
          onCancel={() => setBookedId(null)}
          onStartOver={resetAll}   // <-- critical: fully resets the flow
        />
      )}

      {/* Global Start Over (optional safety) */}
      {(outcome || selection || bookedId) && (
        <div style={{ marginTop: 16 }}>
          <button type="button" onClick={resetAll}>Start Over</button>
        </div>
      )}
    </div>
  )
}