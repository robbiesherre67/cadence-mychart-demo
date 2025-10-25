import { Router } from 'express';
import dayjs from 'dayjs';
import { expandSlots, getAppointments, createAppointment, loadData } from './slotEngine.js';
import { nanoid } from 'nanoid';

export const router = Router();
const { templates, visitTypes, departments } = loadData();

// In-memory request queue (Cadence-like)
const requestQueue = new Map();

router.get('/slots', (req, res) => {
  const { visitTypeId, dept, from, to } = req.query;
  if (!visitTypeId || !dept || !from || !to) {
    return res.status(400).json({ error: 'visitTypeId, dept, from, to required' });
  }
  const deptIds = String(dept).split(',');
  const slots = expandSlots({ visitTypeId, deptIds, from, to });
  res.json(slots);
});

router.post('/appointments', (req, res) => {
  const appt = createAppointment(req.body);
  if (appt.error) return res.status(400).json(appt);
  res.status(201).json(appt);
});

router.get('/appointments', (_req, res) => {
  res.json(getAppointments());
});

router.post('/requests', (req, res) => {
  const id = nanoid();
  const item = { id, status: 'new', createdAt: dayjs().toISOString(), ...req.body };
  requestQueue.set(id, item);
  res.status(201).json(item);
});

router.get('/requests', (_req, res) => {
  res.json(Array.from(requestQueue.values()));
});

router.patch('/requests/:id', (req, res) => {
  const { id } = req.params;
  if (!requestQueue.has(id)) return res.status(404).json({ error: 'not found' });
  const merged = { ...requestQueue.get(id), ...req.body };
  requestQueue.set(id, merged);
  res.json(merged);
});
