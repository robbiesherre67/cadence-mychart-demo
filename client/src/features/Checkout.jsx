import React, { useState } from 'react'

export default function Checkout({ outcome, slot }){
  const [status, setStatus] = useState(null)

  async function book(){
    const body = {
      patientId: 'demoPatient',
      providerId: slot.providerId,
      departmentId: slot.departmentId,
      visitTypeId: outcome.visitTypeIds[0],
      start: slot.start,
      end: slot.end,
      source: 'mychart'
    }
    const r = await fetch('http://localhost:4000/api/appointments', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    const data = await r.json()
    if (r.ok) setStatus(`Booked! Appointment ID ${data.id}`)
    else setStatus(`Failed: ${data.error || 'unknown error'}`)
  }

  return (
    <div style={{marginTop:20, padding:16, border:'1px solid #ddd', borderRadius:12}}>
      <h2>3) Confirm & Book</h2>
      <p>Visit Type: <strong>{outcome.visitTypeIds[0]}</strong></p>
      <p>Time: <strong>{new Date(slot.start).toLocaleString()} → {new Date(slot.end).toLocaleTimeString()}</strong></p>
      <button onClick={book}>Book</button>
      {status && <p style={{marginTop:10}}>{status}</p>}
    </div>
  )
}
