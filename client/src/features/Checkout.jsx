import React, { useState } from 'react'

/**
 * Props:
 * - outcome: { visitTypeIds: string[] }
 * - slot: { start:string, end:string, providerId:string, departmentId:string, token?:string }
 * - onBooked?: (id:string) => void
 * - onCancel?: () => void
 * - onStartOver?: () => void
 */
export default function Checkout({ outcome, slot, onBooked, onCancel, onStartOver }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bookedId, setBookedId] = useState(null)

  if (!outcome || !slot) return null

  async function book() {
    try {
      setLoading(true)
      setStatus(null)

      const body = {
        patientId: 'demoPatient',
        providerId: slot.providerId,
        departmentId: slot.departmentId,
        visitTypeId: outcome.visitTypeIds?.[0],
        start: slot.start,
        end: slot.end,
        source: 'mychart'
      }

      const r = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)

      setBookedId(data.id)
      setStatus(`Booked! Appointment ID ${data.id}`)
      onBooked?.(data.id)
    } catch (err) {
      setStatus(`Failed: ${err.message || 'unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  async function cancelBooking() {
    if (!bookedId) return
    try {
      setLoading(true)
      setStatus(null)

      const r = await fetch(`/api/appointments/${bookedId}`, { method: 'DELETE' })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)

      setStatus('Appointment canceled.')
      setBookedId(null)
      onCancel?.()
    } catch (err) {
      setStatus(`Cancel failed: ${err.message || 'unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  function startOver() {
    setStatus(null)
    setBookedId(null)
    onStartOver?.()
  }

  return (
    <div style={{ marginTop: 20, padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
      <h2>3) Confirm &amp; Book</h2>

      <p>Visit Type: <strong>{outcome.visitTypeIds?.[0] || '—'}</strong></p>
      <p>
        Time:&nbsp;
        <strong>
          {new Date(slot.start).toLocaleString()} → {new Date(slot.end).toLocaleTimeString()}
        </strong>
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={book} disabled={loading || !!bookedId}>
          {loading && !bookedId ? 'Booking…' : bookedId ? 'Booked' : 'Book'}
        </button>

        <button onClick={cancelBooking} disabled={loading || !bookedId}>
          {loading && bookedId ? 'Canceling…' : 'Cancel Booking'}
        </button>

        <button onClick={startOver} disabled={loading}>
          Start Over
        </button>
      </div>

      {status && <p style={{ marginTop: 10 }}>{status}</p>}
    </div>
  )
}