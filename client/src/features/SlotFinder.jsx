import React, { useEffect, useState } from 'react'

export default function SlotFinder({ outcome, onLoaded, onSelect }){
  const [dateRange, setDateRange] = useState({ from: new Date().toISOString().slice(0,10), to: new Date(Date.now()+4*24*3600*1000).toISOString().slice(0,10) })
  const vt = outcome.visitTypeIds[0]
  const dept = outcome.departmentIds.join(',')

  useEffect(()=>{
    async function load(){
      const url = `http://localhost:4000/api/slots?visitTypeId=${vt}&dept=${dept}&from=${dateRange.from}&to=${dateRange.to}`
      const r = await fetch(url)
      const data = await r.json()
      onLoaded(data)
    }
    load()
  }, [vt, dept, dateRange.from, dateRange.to])

  async function handleSelect(s){
    onSelect(s)
  }

  return (
    <div style={{marginTop:20, padding:16, border:'1px solid #ddd', borderRadius:12}}>
      <h2>2) Pick a slot</h2>
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <label>From</label><input type="date" value={dateRange.from} onChange={e=>setDateRange({...dateRange, from:e.target.value})}/>
        <label>To</label><input type="date" value={dateRange.to} onChange={e=>setDateRange({...dateRange, to:e.target.value})}/>
      </div>
      <ul>
        {(onLoaded?[]:[])}{/* noop */}
      </ul>
      <Slots visitTypeId={vt} dept={dept} from={dateRange.from} to={dateRange.to} onSelect={handleSelect} />
    </div>
  )
}

function Slots({ visitTypeId, dept, from, to, onSelect }){
  const [slots, setSlots] = useState([])
  useEffect(()=>{
    (async ()=>{
      const r = await fetch(`http://localhost:4000/api/slots?visitTypeId=${visitTypeId}&dept=${dept}&from=${from}&to=${to}`)
      const data = await r.json()
      setSlots(data)
    })()
  }, [visitTypeId, dept, from, to])

  if (!slots.length) return <p>No slots found. Try another date range.</p>

  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:10, marginTop:10}}>
      {slots.map(s => (
        <button key={s.token} onClick={()=>onSelect(s)} style={{border:'1px solid #ccc', borderRadius:10, padding:12, textAlign:'left'}}>
          <div><strong>{new Date(s.start).toLocaleString()}</strong></div>
          <div>→ {new Date(s.end).toLocaleTimeString()}</div>
          <div>Dept: {s.departmentId}</div>
          <div>Prov: {s.providerId}</div>
        </button>
      ))}
    </div>
  )
}
