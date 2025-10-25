import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';

const dataDir = path.resolve(process.cwd(), 'data');

let _appointments = []; // in-memory

export function loadData() {
  const templates = JSON.parse(fs.readFileSync(path.join(dataDir, 'templates.json'),'utf-8'));
  const visitTypes = JSON.parse(fs.readFileSync(path.join(dataDir, 'visitTypes.json'),'utf-8'));
  const providers = JSON.parse(fs.readFileSync(path.join(dataDir, 'providers.json'),'utf-8'));
  const departments = JSON.parse(fs.readFileSync(path.join(dataDir, 'departments.json'),'utf-8'));
  const decisionTree = JSON.parse(fs.readFileSync(path.join(dataDir, 'decisionTree.json'),'utf-8'));
  return { templates, visitTypes, providers, departments, decisionTree };
}

function minutesBetween(startISO, endISO) {
  return dayjs(endISO).diff(dayjs(startISO), 'minute');
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return dayjs(aStart).isBefore(dayjs(bEnd)) && dayjs(bStart).isBefore(dayjs(aEnd));
}

export function expandBlocksToSlots(block, fromISO, toISO) {
  const slots = [];
  let cursor = dayjs(block.start);
  const end = dayjs(block.end);
  while (cursor.add(block.slotSizeMin, 'minute').isSameOrBefore(end)) {
    const s = cursor.toISOString();
    const e = cursor.add(block.slotSizeMin, 'minute').toISOString();
    if (dayjs(s).isBetween(dayjs(fromISO), dayjs(toISO), null, '[]')) {
      slots.push({ start: s, end: e, providerId: block.providerId, departmentId: block.departmentId, token: `${block.id}:${s}` });
    }
    cursor = cursor.add(block.slotSizeMin, 'minute');
  }
  return slots;
}

export function expandSlots({ visitTypeId, deptIds, from, to }) {
  const { templates, visitTypes } = loadData();
  const vt = visitTypes.find(v => v.id === visitTypeId);
  if (!vt) return [];
  const fromISO = dayjs(from).startOf('day').toISOString();
  const toISO = dayjs(to).endOf('day').toISOString();

  const candidateBlocks = templates.filter(t =>
    deptIds.includes(t.departmentId) &&
    t.visitTypeIdsAllowed.includes(visitTypeId)
  );

  // Expand to 15-min atoms, then stitch to duration
  const atoms = candidateBlocks.flatMap(b => expandBlocksToSlots(b, fromISO, toISO));

  // Remove occupied atoms
  const occupied = _appointments.flatMap(a => {
    return [{ start: a.start, end: a.end, providerId: a.providerId, departmentId: a.departmentId }];
  });

  const free = atoms.filter(sl => !occupied.some(o => overlaps(sl.start, sl.end, o.start, o.end)));

  // Coalesce atoms into visitType duration
  const need = vt.durationMin;
  const grouped = [];
  for (let i=0; i<free.length; i++) {
    const start = dayjs(free[i].start);
    let length = 15;
    let j = i;
    while (j+1 < free.length &&
           free[j].providerId === free[j+1].providerId &&
           free[j].departmentId === free[j+1].departmentId &&
           dayjs(free[j+1].start).diff(dayjs(free[j].start), 'minute') === 15) {
      length += 15;
      j++;
      if (length >= need) break;
    }
    if (length >= need) {
      grouped.push({
        start: start.toISOString(),
        end: start.add(need, 'minute').toISOString(),
        providerId: free[i].providerId,
        departmentId: free[i].departmentId,
        token: free[i].token
      });
    }
  }
  return grouped;
}

export function createAppointment(body) {
  const { patientId, providerId, departmentId, visitTypeId, start, end, source, linkedOrderId } = body || {};
  if (!patientId || !providerId || !departmentId || !visitTypeId || !start || !end) {
    return { error: 'Missing required fields' };
  }
  // very light conflict check
  if (_appointments.some(a => a.providerId === providerId && overlaps(start, end, a.start, a.end))) {
    return { error: 'Slot already taken' };
  }
  const appt = { id: nanoid(), patientId, providerId, departmentId, visitTypeId, start, end, status: 'booked', source: source || 'staff', linkedOrderId };
  _appointments.push(appt);
  return appt;
}

export function getAppointments() {
  return _appointments;
}
