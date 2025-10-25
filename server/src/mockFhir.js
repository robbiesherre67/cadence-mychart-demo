import { Router } from 'express';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { expandSlots, createAppointment, loadData } from './slotEngine.js';

export const router = Router();
const { visitTypes, departments } = loadData();

// Very minimal mock FHIR

router.get('/Slot', (req, res) => {
  const { 'service-type': serviceType, location, date } = req.query;
  // map service-type (visitTypeId) and location (departmentId)
  const slots = [
    ...expandSlots({ visitTypeId: serviceType, deptIds: [location], from: date, to: date })
  ].map(s => ({
    resourceType: 'Slot',
    id: s.token,
    schedule: { reference: 'Schedule/SCHED1' },
    status: 'free',
    start: s.start,
    end: s.end
  }));
  res.json({ resourceType: 'Bundle', total: slots.length, entry: slots.map(r => ({ resource: r })) });
});

router.post('/Appointment', (req, res) => {
  const { start, end, participant = [], basedOn } = req.body || {};
  // naive mapping
  const patient = participant.find(p => p.actor?.reference?.startsWith('Patient/'))?.actor?.reference?.split('/')[1] || 'demoPatient';
  const practitioner = participant.find(p => p.actor?.reference?.startsWith('Practitioner/'))?.actor?.reference?.split('/')[1] || 'demoProvider';
  const location = participant.find(p => p.actor?.reference?.startsWith('Location/'))?.actor?.reference?.split('/')[1] || 'DEPT1';
  const vt = (req.body?.serviceType?.[0]?.coding?.[0]?.code) || 'primary_care_new';

  const appt = createAppointment({
    patientId: patient,
    providerId: practitioner,
    departmentId: location,
    visitTypeId: vt,
    start, end, source: 'mychart', linkedOrderId: basedOn?.[0]?.reference
  });
  if (appt.error) return res.status(400).json(appt);
  res.status(201).json({ resourceType: 'Appointment', id: appt.id, start, end, status: 'booked' });
});

router.get('/ServiceRequest/:id', (req, res) => {
  res.json({
    resourceType: 'ServiceRequest',
    id: req.params.id,
    status: 'active',
    code: { coding: [{ system: 'demo', code: 'KNEE_MRI', display: 'MRI Knee' }] }
  });
});
