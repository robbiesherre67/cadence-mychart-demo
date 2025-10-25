import React, { useEffect, useState } from 'react'
import SymptomWizard from './features/SymptomWizard.jsx'
import SlotFinder from './features/SlotFinder.jsx'
import Checkout from './features/Checkout.jsx'

export default function App(){
  const [outcome, setOutcome] = useState(null)
  const [slots, setSlots] = useState([])
  const [selection, setSelection] = useState(null)

  useEffect(()=>{ document.title='Cadence + MyChart Demo' }, [])

  return (
    <div style={{fontFamily:'system-ui', padding:20, maxWidth:860, margin:'0 auto'}}>
      <h1>Cadence + MyChart Demo</h1>
      <ol>
        <li>Select a need in the wizard</li>
        <li>Pick a slot</li>
        <li>Book the appointment</li>
      </ol>

      <SymptomWizard onDone={setOutcome} />
      {outcome && <SlotFinder outcome={outcome} onLoaded={setSlots} onSelect={setSelection} />}
      {selection && <Checkout outcome={outcome} slot={selection} />}
    </div>
  )
}
