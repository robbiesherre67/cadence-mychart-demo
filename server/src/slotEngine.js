import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import { nanoid } from 'nanoid';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPTS = new Map(); // id -> appointment

const normISO = (s) => {
  if (!s) return s;
  return /Z$|[+\-]\d{2}:\d{2}$/.test(s) ? s : `${s}Z`;
};

function loadJson(relPath) {
  const full = path.join(__dirname, relPath);
  return JSON.parse(fs.readFileSync(full, 'utf-8'));
}

export function loadData() {
  const templates = loadJson('../data/templates.json');
  let departments = [];
  let providers = [];
  let visitTypes = [];

  try { departments = loadJson('../data/departments.json'); } catch {}
  try { providers = loadJson('../data/providers.json'); } catch {}
  try { visitTypes = loadJson('../data/visitTypes.json'); } catch {}

  return { templates, departments, providers, visitTypes };
}

function* iterateSlots(startUtc, endUtc, minutes, capacity, base) {
  let cursor = startUtc;
  while (cursor.isSameOrBefore(endUtc)) {
    const end = cursor.add(minutes, 'minute');
    if (end.isAfter(endUtc)) break;
    for (let i = 0; i < (capacity || 1); i++) {
      yield {
        start: cursor.toISOString(),
        end: end.toISOString(),
        departmentId: base.departmentId,
        providerId: base.providerId,
        visitTypeIdsAllowed: base.visitTypeIdsAllowed || [],
        token: `${base.providerId}-${base.departmentId}-${cursor.unix()}-${i}`,
      };
    }
    cursor = end;
  }
}

export function expandSlots(templates, fromISO, toISO) {
  const from = dayjs.utc(normISO(fromISO));
  const to   = dayjs.utc(normISO(toISO));
  const out = [];

  for (const t of templates) {
    const base = {
      providerId: t.providerId,
      departmentId: t.departmentId,
      visitTypeIdsAllowed: t.visitTypeIdsAllowed || [],
    };

    if (t.start && t.end && t.slotSizeMin) {
      const winStart = dayjs.utc(normISO(t.start));
      const winEnd   = dayjs.utc(normISO(t.end));
      const start = winStart.isAfter(from) ? winStart : from;
      const end   = winEnd.isBefore(to) ? winEnd : to;
      if (start.isSameOrBefore(end)) {
        for (const slot of iterateSlots(start, end, t.slotSizeMin, t.capacity || 1, base)) {
          out.push(slot);
        }
      }
      continue;
    }

    if (t.daysOfWeek && t.startHour != null && t.endHour != null && t.durationMinutes) {
      let cursor = from.startOf('day');
      const last = to.startOf('day');
      while (cursor.isSameOrBefore(last)) {
        const dow = cursor.day(); // 0..6 (0=Sun)
        if (t.daysOfWeek.includes(dow)) {
          const dayStart = cursor.hour(t.startHour).minute(0).second(0).millisecond(0);
          const dayEnd   = cursor.hour(t.endHour).minute(0).second(0).millisecond(0);
          for (const slot of iterateSlots(dayStart, dayEnd, t.durationMinutes, t.capacity || 1, base)) {
            const s = dayjs.utc(slot.start);
            const e = dayjs.utc(slot.end);
            if (!s.isBefore(from) && !e.isAfter(to)) {
              out.push(slot);
            }
          }
        }
        cursor = cursor.add(1, 'day');
      }
      continue;
    }

  }

  out.sort((a, b) => dayjs.utc(a.start).valueOf() - dayjs.utc(b.start).valueOf());
  return out;
}


export function createAppointment(input) {
  // expected fields: patientId, providerId, departmentId, visitTypeId, start, end, source
  const id = nanoid(10);
  const appt = {
    id,
    status: 'booked',
    createdAt: new Date().toISOString(),
    ...input,
  };
  APPTS.set(id, appt);
  return appt;
}

export function cancelAppointment(id) {
  const a = APPTS.get(id);
  if (!a) return false;
  a.status = 'canceled';
  APPTS.set(id, a);
  return true;
}

export function listAppointments() {
  return Array.from(APPTS.values());
}