import React, { useEffect, useMemo, useState } from 'react'

/**
 * Props:
 * - outcome: { visitTypeIds: string[], departmentIds: string[] }
 * - onLoaded?: (slots:any[]) => void
 * - onSelect?: (slot:any) => void
 * - selectedToken?: string
 */
export default function SlotFinder({ outcome, onLoaded, onSelect, selectedToken }) {
  // default: today .. +4 days
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date()
    const to = new Date(today.getTime() + 4 * 24 * 3600 * 1000)
    const fmt = (d) => d.toISOString().slice(0, 10)
    return { from: fmt(today), to: fmt(to) }
  })

  const vt = outcome?.visitTypeIds?.[0] ?? ''
  const dept = useMemo(() => (outcome?.departmentIds || []).join(','), [outcome])

  return (
    <div style={{ marginTop: 20, padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
      <h2>2) Pick a slot</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>From</label>
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
        />
        <label>To</label>
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
        />
      </div>

      <Slots
        visitTypeId={vt}
        dept={dept}
        from={dateRange.from}
        to={dateRange.to}
        onLoaded={onLoaded}
        onSelect={onSelect}
        selectedToken={selectedToken}
      />
    </div>
  )
}

function Slots({ visitTypeId, dept, from, to, onLoaded, onSelect, selectedToken }) {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!visitTypeId || !dept || !from || !to) {
      setSlots([])
      return
    }

    const ac = new AbortController()
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          visitTypeId,
          dept,
          from,
          to,
        }).toString()

        const r = await fetch(`/api/slots?${params}`, { signal: ac.signal })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        setSlots(Array.isArray(data) ? data : [])
        onLoaded?.(Array.isArray(data) ? data : [])
      } catch (e) {
        if (e.name === 'AbortError') return
        setError(e.message || 'Failed to load slots')
        setSlots([])
        onLoaded?.([])
      } finally {
        setLoading(false)
      }
    }
    run()

    return () => ac.abort()
  }, [visitTypeId, dept, from, to, onLoaded])

  if (loading) return <p style={{ marginTop: 10 }}>Loading available times…</p>
  if (error) return <p style={{ marginTop: 10, color: '#b00020' }}>Error: {error}</p>
  if (!slots.length) {
    return (
      <p style={{ marginTop: 10 }}>
        No slots found. Try another date range (weekdays usually have availability).
      </p>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 10,
        marginTop: 10,
      }}
    >
      {slots.map((s) => {
        const isSelected = s.token === selectedToken
        return (
          <button
            key={s.token}
            onClick={() => onSelect?.(s)}
            style={{
              border: isSelected ? '2px solid #111' : '1px solid #ccc',
              borderRadius: 10,
              padding: 12,
              textAlign: 'left',
              background: isSelected ? '#f5f5f5' : 'white',
              cursor: 'pointer',
              boxShadow: isSelected ? '0 0 0 2px rgba(0,0,0,0.05) inset' : 'none',
            }}
            aria-pressed={isSelected}
            title={`Book ${new Date(s.start).toLocaleString()}`}
          >
            <div style={{ fontWeight: 600 }}>{new Date(s.start).toLocaleString()}</div>
            <div>→ {new Date(s.end).toLocaleTimeString()}</div>
            <div>Dept: {s.departmentId}</div>
            <div>Prov: {s.providerId}</div>
          </button>
        )
      })}
    </div>
  )
}