import { Router } from 'express'
import { expandSlots, loadData, createAppointment, cancelAppointment, listAppointments } from './slotEngine.js'

const router = Router()
const { templates } = loadData()

// GET /api/slots?visitTypeId=&dept=&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/slots', (req, res) => {
  const { visitTypeId, dept, from, to } = req.query
  if (!from || !to) return res.status(400).json({ error: 'from and to are required (YYYY-MM-DD)' })

  const fromISO = `${from}T00:00:00Z`
  const toISO   = `${to}T23:59:59Z`

  let slots = expandSlots(templates, fromISO, toISO)

  if (visitTypeId) {
    slots = slots.filter(s => !s.visitTypeIdsAllowed?.length || s.visitTypeIdsAllowed.includes(visitTypeId))
  }
  if (dept) {
    const set = new Set(String(dept).split(',').map(x => x.trim()).filter(Boolean))
    slots = slots.filter(s => set.has(s.departmentId))
  }

  res.json(slots)
})

// POST /api/appointments
router.post('/appointments', (req, res) => {
  const b = req.body || {}
  const required = ['patientId','providerId','departmentId','visitTypeId','start','end']
  const missing = required.filter(k => !b[k])
  if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` })

  const appt = createAppointment(b)
  res.status(201).json({ id: appt.id })
})

// DELETE /api/appointments/:id
router.delete('/appointments/:id', (req, res) => {
  const ok = cancelAppointment(req.params.id)
  if (!ok) return res.status(404).json({ error: 'not found' })
  res.json({ ok: true })
})

// (optional) list
router.get('/appointments', (_req, res) => res.json(listAppointments()))

export { router }
