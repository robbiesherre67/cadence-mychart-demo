// server/src/mockFhir.js
import { Router } from 'express';
import { expandSlots, createAppointment, cancelAppointment, loadData } from './slotEngine.js';

const router = Router();
const { templates } = loadData();

/**
 * Minimal FHIR-ish endpoints just for demo purposes.
 * These mirror the core API behavior so external tools can poke them.
 */

// Capability statement (stub)
router.get('/metadata', (_req, res) => {
  res.json({ resourceType: 'CapabilityStatement', status: 'active', kind: 'instance' });
});

// FHIR Slot search (map to our template expansion)
// Example: /fhir/Slot?start=2025-10-25&end=2025-10-29&visitTypeId=primary_care_new&dept=DEPT1
router.get('/Slot', (req, res) => {
  const { start, end, visitTypeId, dept } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end are required (YYYY-MM-DD)' });

  const fromISO = `${start}T00:00:00Z`;
  const toISO   = `${end}T23:59:59Z`;

  let slots = expandSlots(templates, fromISO, toISO);

  if (visitTypeId) {
    slots = slots.filter(s => !s.visitTypeIdsAllowed?.length || s.visitTypeIdsAllowed.includes(visitTypeId));
  }
  if (dept) {
    const set = new Set(String(dept).split(',').map(x => x.trim()).filter(Boolean));
    slots = slots.filter(s => set.has(s.departmentId));
  }

  // Return in a FHIR-ish bundle
  const entries = slots.map(s => ({
    resource: {
      resourceType: 'Slot',
      status: 'free',
      start: s.start,
      end: s.end,
      schedule: { reference: `Schedule/${s.providerId}-${s.departmentId}` },
      extension: [
        { url: 'visitTypeIdsAllowed', valueString: (s.visitTypeIdsAllowed || []).join(',') },
        { url: 'providerId', valueString: s.providerId },
        { url: 'departmentId', valueString: s.departmentId },
        { url: 'token', valueString: s.token },
      ],
    },
  }));

  res.json({ resourceType: 'Bundle', type: 'searchset', total: entries.length, entry: entries });
});

// Create an appointment
router.post('/Appointment', (req, res) => {
  const appt = createAppointment(req.body || {});
  res.status(201).json({
    resourceType: 'Appointment',
    id: appt.id,
    status: appt.status,
    start: appt.start,
    end: appt.end,
    participant: [
      { actor: { reference: `Patient/${appt.patientId}` }, status: 'accepted' },
      { actor: { reference: `Practitioner/${appt.providerId}` }, status: 'accepted' },
    ],
    extension: [
      { url: 'departmentId', valueString: appt.departmentId },
      { url: 'visitTypeId', valueString: appt.visitTypeId },
      { url: 'source', valueString: appt.source || 'demo' },
    ],
  });
});

// Cancel an appointment
router.delete('/Appointment/:id', (req, res) => {
  const ok = cancelAppointment(req.params.id);
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

export { router };