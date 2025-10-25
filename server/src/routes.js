// routes.js
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expandSlots } from './slotEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

function loadJson(relPath) {
  const full = path.join(__dirname, relPath);
  return JSON.parse(fs.readFileSync(full, 'utf-8'));
}

const templates = loadJson('../data/templates.json');
const departments = (() => {
  try { return loadJson('../data/departments.json'); } catch { return []; }
})();
const providers = (() => {
  try { return loadJson('../data/providers.json'); } catch { return []; }
})();

// GET /api/slots?visitTypeId=...&dept=DEPT1,DEPT2&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/slots', (req, res) => {
  const { visitTypeId, dept, from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to are required (YYYY-MM-DD)' });

  // Expand date-only to full-day UTC
  const fromISO = `${from}T00:00:00Z`;
  const toISO   = `${to}T23:59:59Z`;

  // Build slot list from templates
  let slots = expandSlots(templates, fromISO, toISO);

  // Filter by visit type if provided
  if (visitTypeId) {
    slots = slots.filter(s => !s.visitTypeIdsAllowed?.length || s.visitTypeIdsAllowed.includes(visitTypeId));
  }

  // Filter by department(s) if provided
  if (dept) {
    const set = new Set(String(dept).split(',').map(s => s.trim()).filter(Boolean));
    slots = slots.filter(s => set.has(s.departmentId));
  }

  return res.json(slots);
});

export { router };