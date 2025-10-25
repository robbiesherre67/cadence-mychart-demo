import React, { useEffect, useState } from 'react'

export default function SymptomWizard({ onDone }){
  const [tree, setTree] = useState(null)
  const [choice, setChoice] = useState(null)

  useEffect(()=>{
    fetch('http://localhost:4000/api/tree').catch(()=>{})
  }, [])

  // inline a tiny tree to avoid extra server call
  const options = [
    { value: 'primary_care', label: 'Primary Care' },
    { value: 'knee_pain', label: 'Knee Pain (Ortho)' },
    { value: 'imaging_knee_mri', label: 'MRI Knee (Order-based)' },
    { value: 'telehealth', label: 'Telehealth Primary' },
  ]

  const terminal = {
    primary_care: { visitTypeIds:['primary_care_new'], departmentIds:['DEPT1'] },
    knee_pain: { visitTypeIds:['ortho_new'], departmentIds:['DEPT2'] },
    imaging_knee_mri: { visitTypeIds:['mri_knee'], departmentIds:['DEPT2'] },
    telehealth: { visitTypeIds:['telehealth_primary'], departmentIds:['VIRT'] }
  }

  function handleNext(){
    if (!choice) return;
    onDone(terminal[choice])
  }

  return (
    <div style={{marginTop:20, padding:16, border:'1px solid #ddd', borderRadius:12}}>
      <h2>1) What do you need help with?</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12}}>
        {options.map(o => (
          <button key={o.value} onClick={()=>setChoice(o.value)}
            style={{padding:12, borderRadius:10, border: choice===o.value?'2px solid black':'1px solid #ccc', textAlign:'left'}}>
            {o.label}
          </button>
        ))}
      </div>
      <div style={{marginTop:12}}>
        <button onClick={handleNext} disabled={!choice}>Continue</button>
      </div>
    </div>
  )
}
